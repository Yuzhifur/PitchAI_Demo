from haystack import Pipeline
from haystack.document_stores import InMemoryDocumentStore
from haystack.nodes import PreProcessor, EmbeddingRetriever
from haystack.schema import Document
from typing import List, Dict, Any
import os
from ...core.config.settings import settings


class HaystackClient:
    def __init__(self):
        self.document_store = InMemoryDocumentStore()
        self.pipeline = self._create_pipeline()

    def _create_pipeline(self) -> Pipeline:
        # 创建文档处理管道
        pipeline = Pipeline()

        # 添加文档预处理节点
        preprocessor = PreProcessor(
            clean_empty_lines=True,
            clean_whitespace=True,
            clean_header_footer=True,
            split_by="word",
            split_length=500,
            split_overlap=50,
        )

        # 添加检索节点
        retriever = EmbeddingRetriever(
            document_store=self.document_store,
            embedding_model="sentence-transformers/all-MiniLM-L6-v2",
        )

        pipeline.add_node(component=preprocessor, name="PreProcessor", inputs=["File"])
        pipeline.add_node(
            component=retriever, name="Retriever", inputs=["PreProcessor"]
        )

        return pipeline

    async def process_document(self, file_path: str) -> List[Document]:
        """处理文档并返回处理后的文档列表"""
        return self.pipeline.run(file_paths=[file_path])

    async def query_documents(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """查询文档"""
        results = self.pipeline.run(query=query, params={"Retriever": {"top_k": top_k}})
        return results


haystack_client = HaystackClient()
