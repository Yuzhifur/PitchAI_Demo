import openai
from typing import Dict, List, Any
import json
from ...core.config.settings import settings

class DeepSeekClient:
    def __init__(self):
        self.client = openai.OpenAI(
            api_key=settings.DEEPSEEK_API_KEY,
            base_url=settings.DEEPSEEK_BASE_URL
        )

    async def evaluate_business_plan(self, document_text: str) -> Dict[str, Any]:
        """Main evaluation function"""
        dimensions = {
            "team": {"max_score": 30, "sub_dimensions": ["核心团队背景", "团队完整性", "团队执行力"]},
            "product": {"max_score": 20, "sub_dimensions": ["技术创新性", "产品成熟度", "研发能力"]},
            "market": {"max_score": 20, "sub_dimensions": ["市场空间", "竞争分析", "市场策略"]},
            "business": {"max_score": 20, "sub_dimensions": ["盈利模式", "运营模式", "发展模式"]},
            "finance": {"max_score": 10, "sub_dimensions": ["财务状况", "融资需求"]}
        }

        results = {}
        missing_info = []

        for dimension_key, dimension_config in dimensions.items():
            evaluation = await self._evaluate_dimension(
                dimension_key,
                dimension_config,
                document_text
            )
            results[dimension_key] = evaluation
            missing_info.extend(evaluation.get("missing_info", []))

        total_score = sum(result["score"] for result in results.values())

        return {
            "dimensions": results,
            "total_score": total_score,
            "missing_information": missing_info
        }

    async def _evaluate_dimension(self, dimension: str, config: Dict, document_text: str) -> Dict[str, Any]:
        """Evaluate a specific dimension"""
        prompt = self._get_dimension_prompt(dimension, config, document_text)

        try:
            response = self.client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {"role": "system", "content": "你是一个专业的项目评审专家，负责评估商业计划书。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )

            result = json.loads(response.choices[0].message.content)
            return result

        except Exception as e:
            # Fallback response if API fails
            return {
                "score": 0,
                "max_score": config["max_score"],
                "comments": f"评估失败: {str(e)}",
                "sub_dimensions": [],
                "missing_info": []
            }

    def _get_dimension_prompt(self, dimension: str, config: Dict, document_text: str) -> str:
        """Generate evaluation prompt for specific dimension"""
        prompts = {
            "team": f"""
分析以下商业计划书中的团队能力维度，总分{config['max_score']}分：

评分标准：
- 核心团队背景 (10分): 行业经验、技术背景、管理经验
- 团队完整性 (10分): 核心岗位配置、团队规模、团队结构
- 团队执行力 (10分): 过往成就、项目经验、资源整合能力

商业计划书内容：
{document_text}

请返回JSON格式的评估结果：
{{
    "score": 总分,
    "max_score": {config['max_score']},
    "comments": "详细评价",
    "sub_dimensions": [
        {{"name": "核心团队背景", "score": 分数, "max_score": 10, "comments": "评价"}},
        {{"name": "团队完整性", "score": 分数, "max_score": 10, "comments": "评价"}},
        {{"name": "团队执行力", "score": 分数, "max_score": 10, "comments": "评价"}}
    ],
    "missing_info": [
        {{"type": "缺失信息类型", "description": "具体描述"}}
    ]
}}
""",
            # Add prompts for other dimensions...
        }

        return prompts.get(dimension, "")

deepseek_client = DeepSeekClient()