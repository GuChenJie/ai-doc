# RAG Chunk 知识

Chunk 的目标不是“切得越碎越好”，而是让每个片段既能保留上下文，又方便检索命中。

## 一、基础切分

### 1. 固定长度切分

最简单的方式，按字符数、词数或 token 数硬切。

```ts
export function chunkTextByFixedLength(text: string, rawOptions: Pick<ChunkingOptions, "chunkSize" | "chunkOverlap"> = {}): string[] {
	const options = { ...DEFAULT_OPTIONS, ...rawOptions };
	const normalizedText = normalizeLineEndings(text).trim();
	if (!normalizedText) {
		return [];
	}

	const chunks: string[] = [];
	let cursor = 0;

	while (cursor < normalizedText.length) {
		const end = Math.min(normalizedText.length, cursor + options.chunkSize);
		const chunk = normalizedText.slice(cursor, end).trim();
		if (chunk) {
			chunks.push(chunk);
		}

		if (end >= normalizedText.length) {
			break;
		}

		cursor = Math.max(end - options.chunkOverlap, cursor + 1);
	}

	return chunks;
}
```

**适用场景**
- 先把系统跑起来
- 文档结构不明显
- 对稳定性要求高于召回质量

### 2. 递归切分

先按大结构切，再逐层细分，直到满足长度限制。

```ts
export function chunkTextRecursively(
	text: string,
	rawOptions: Pick<ChunkingOptions, "chunkSize" | "chunkOverlap"> = {},
): string[] {
	const options = { ...DEFAULT_OPTIONS, ...rawOptions };
	const normalizedText = normalizeLineEndings(text).trim();
	if (!normalizedText) {
		return [];
	}

	return splitByHierarchy(normalizedText, ["\n\n", "\n", ". ", "? ", "! ", "; ", " ", ""], options.chunkSize, options.chunkOverlap);
}
```

### 3. 基于句子的切分

按句号、问号、分号等边界切分，再按长度控制合并。

```ts
export function chunkTextBySentence(text: string): string[] {
	const normalized = normalizeLineEndings(text).trim();
	if (!normalized) {
		return [];
	}

	const sentences = isChineseDominant(normalized) ? splitChineseSentences(normalized) : splitEnglishSentences(normalized);
	return sentences.length > 0 ? sentences : [normalized];
}
```

## 二、结构切分

### 1. Markdown 切分

按标题层级、段落、代码块切。

```ts
export function buildMarkdownRagIngestBody(input: ChunkDocumentInput, rawOptions: ChunkingOptions = {}): RagIngestBody {
	const options = { ...DEFAULT_OPTIONS, ...rawOptions };
	const cleanedContent = normalizeMarkdownContent(input.content);
	const title = input.title?.trim() || extractTitle(cleanedContent, input.relativePath);
	const documentId = buildDocumentId(input.relativePath);
	const sections = splitIntoSections(cleanedContent);
	const chunks: RagIngestBody["chunks"] = [];
	let nextChunkIndex = 0;

	for (const section of sections) {
		const result = chunkSection(section, documentId, input.relativePath, options, nextChunkIndex, input.metadata);
		chunks.push(...result.chunks);
		nextChunkIndex = result.nextChunkIndex;
	}

	return assembleRagIngestBody(
		{
			documentId,
			namespace: options.namespace,
			title,
			metadata: input.metadata,
		},
		chunks,
	);
}
```

```ts
function chunkSection(
	section: MarkdownSection,
	documentId: string,
	relativePath: string,
	options: Required<Pick<ChunkingOptions,
		| "namespace"
		| "targetChineseChars"
		| "maxChineseChars"
		| "overlapChineseChars"
		| "targetEnglishWords"
		| "maxEnglishWords"
		| "overlapEnglishWords"
	>>,
	startChunkIndex: number,
	metadata?: RagMetadata,
): { chunks: RagIngestBody["chunks"]; nextChunkIndex: number } {
	const chunks: RagIngestBody["chunks"] = [];
	const sectionPath = section.headingPath.join(" > ");
	let chunkIndex = startChunkIndex;

	for (const block of section.blocks) {
		const parts = splitBlock(block, options);
		for (const part of parts) {
			const text = part.trim();
			if (!text) {
				continue;
			}

			chunks.push({
				chunkId: `${documentId}:${String(chunkIndex).padStart(4, "0")}`,
				index: chunkIndex,
				text,
				metadata: buildChunkMetadata(relativePath, sectionPath, text, metadata),
			});
			chunkIndex += 1;
		}
	}

	return {
		chunks: mergeTinyTailChunks(chunks, options),
		nextChunkIndex: chunkIndex,
	};
}
```

### 2. 对话式切分

按角色和轮次切，比如 user / assistant、Q / A。

```ts
export function buildDialogueRagIngestBody(input: ChunkDocumentInput, rawOptions: ChunkingOptions = {}): RagIngestBody {
	const options = { ...DEFAULT_OPTIONS, ...rawOptions };
	const content = normalizeMarkdownContent(input.content);
	const documentId = buildDocumentId(input.relativePath);
	const title = input.title?.trim() || extractTitle(content, input.relativePath);
	const turns = parseDialogueTurns(content);
	const chunks = groupDialogueTurns(turns, options).map((text, index) => createRagChunk(documentId, index, text, input.metadata));

	return assembleRagIngestBody(
		{
			documentId,
			namespace: options.namespace,
			title,
			metadata: input.metadata,
		},
		chunks,
	);
}
```

## 三、语义切分

### 1. 语义切分

根据相邻段落的语义相似度决定是否合并。

```ts
export function semanticChunkParagraphs(paragraphs: string[], options: Pick<ChunkingOptions, "semanticThreshold" | "chunkSize" | "chunkOverlap"> = {}): string[] {
	const mergedParagraphs: string[] = [];
	const threshold = options.semanticThreshold ?? DEFAULT_OPTIONS.semanticThreshold;
	const targetSize = options.chunkSize ?? DEFAULT_OPTIONS.chunkSize;
	const overlap = options.chunkOverlap ?? DEFAULT_OPTIONS.chunkOverlap;

	let current: string[] = [];
	let currentKeywords: string[] = [];

	for (const paragraph of paragraphs) {
		const paragraphKeywords = extractKeywords(paragraph);
		const similarity = currentKeywords.length > 0 ? jaccardSimilarity(currentKeywords, paragraphKeywords) : 1;
		const candidate = [...current, paragraph];

		if (candidate.length <= targetSize && similarity >= threshold) {
			current = candidate;
			currentKeywords = extractKeywords(current.join("\n\n"));
			continue;
		}

		if (current.length > 0) {
			mergedParagraphs.push(current.join("\n\n"));
		}

		current = current.length > 0 && overlap > 0 ? current.slice(-overlap) : [];
		current.push(paragraph);
		currentKeywords = extractKeywords(current.join("\n\n"));
	}

	if (current.length > 0) {
		mergedParagraphs.push(current.join("\n\n"));
	}

	return mergedParagraphs.filter(Boolean);
}
```

### 2. 主题切分

按主题聚类或主题变化点切分。

### 3. 基于相似度的段落合并

先按段落切，再根据相似度和长度阈值合并。

## 四、高级切分

### 1. Parent-Child Chunk

把大块内容当 parent，小块内容当 child。

### 2. Agentic Chunk

让模型参与判断切分边界。

```ts
export function buildAgenticRagIngestBody(input: ChunkDocumentInput, rawOptions: ChunkingOptions = {}): RagIngestBody {
	const options = { ...DEFAULT_OPTIONS, ...rawOptions };
	const content = normalizeMarkdownContent(input.content);
	const paragraphs = splitParagraphs(content);
	const hasMarkdownStructure = /^#{1,6}\s+/m.test(content) || /```/u.test(content);
	const hasDialogueStructure = /^[^\n:：]{1,32}[:：]\s+/m.test(content);
	const longDocument = paragraphs.length >= 4;

	// 先按内容特征选最贴近的切分方式。
	if (hasMarkdownStructure) {
		return buildMarkdownRagIngestBody(input, options);
	}

	if (hasDialogueStructure) {
		return buildDialogueRagIngestBody(input, options);
	}

	if (longDocument) {
		return buildSemanticRagIngestBody(input, options);
	}

	// 都不明显时，回退到最稳的固定长度切分。
	return buildFixedLengthRagIngestBody(input, options);
}
```

### 3. 自适应切分

根据文档类型自动选择策略。

## 五、混合切分

混合切分的核心是：不要只依赖一种边界。

### 常见组合

- Markdown + 固定长度
- 语义 + 固定长度
- 章节 + 句子
- Parent-Child + 结构切分

### 适合什么情况

- 你希望 chunk 既稳定又不太粗
- 文档类型不统一
- 召回效果比实现简单更重要

## 六、选型建议

- **先上线**：固定长度 / 递归切分
- **文档型内容**：Markdown / 章节切分
- **问答和对话**：对话切分
- **长文和复杂内容**：语义切分
- **追求更高质量**：混合切分

## 七、和代码实现的关系

现在项目里的实现可以当成这份知识文档的代码参考：

- `src/common/rag/chunk/basic/`
- `src/common/rag/chunk/structured/`
- `src/common/rag/chunk/semantic/`
- `src/common/rag/chunk/hybrid/`

如果后续继续补内容，建议按“方法原理 / 适用场景 / 代码实现 / 选型建议”这个顺序展开。
