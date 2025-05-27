"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { projectApi, scoreApi, reportApi, businessPlanApi } from "@/lib/api";
import Layout from '@/components/Layout';

import type { Score, MissingInfo } from "@/lib/types";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [missingInfo, setMissingInfo] = useState<MissingInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingStatus, setProcessingStatus] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedScores, setEditedScores] = useState<Score[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectRes, scoresRes, missingInfoRes] = await Promise.all([
          projectApi.getDetail(projectId),
          scoreApi.getScores(projectId),
          scoreApi.getMissingInfo(projectId),
        ]);
        setProject(projectRes.data);
        setScores(scoresRes.data.dimensions);
        setEditedScores(scoresRes.data.dimensions);
        setMissingInfo(missingInfoRes.data.items);
      } catch (err: any) {
        setError(err.response?.data?.message || "获取项目详情失败");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  useEffect(() => {
    if (project?.status === 'processing') {
      const ws = new WebSocket(`ws://localhost:8000/ws/projects/${projectId}/status`);
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setProcessingStatus(data);
      };

      return () => {
        ws.close();
      };
    }
  }, [project?.status, projectId]);

  const handleDownloadReport = async () => {
    try {
      const response = await reportApi.downloadReport(projectId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `评审报告_${project.project_name}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError(err.response?.data?.message || '下载报告失败');
    }
  };

  const handleScoreChange = (dimension: string, field: 'score' | 'comments', value: string | number) => {
    setEditedScores(prev => prev.map(score => 
      score.dimension === dimension 
        ? { ...score, [field]: value }
        : score
    ));
  };

  const handleSave = async () => {
    try {
      await scoreApi.updateScores(projectId, editedScores);
      setScores(editedScores);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "保存评分失败");
    }
  };

  const handleOpenHistory = async () => {
    setShowHistory(true);
    setHistoryLoading(true);
    try {
      const res = await projectApi.list({ search: project.enterprise_name });
      setHistoryList(res.data.items || []);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 评分维度图标和配色
  const dimensionMeta: Record<string, { icon: string; color: string; text: string }> = {
    "团队能力": { icon: "fa-users", color: "text-purple-400", text: "text-purple-600" },
    "产品&技术": { icon: "fa-microchip", color: "text-pink-400", text: "text-pink-600" },
    "市场前景": { icon: "fa-chart-line", color: "text-blue-400", text: "text-blue-600" },
    "商业模式": { icon: "fa-briefcase", color: "text-green-400", text: "text-green-600" },
    "财务情况": { icon: "fa-coins", color: "text-yellow-400", text: "text-yellow-600" },
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f3e8ff 100%)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f3e8ff 100%)' }}>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen flex flex-col" style={{ fontFamily: 'Inter, sans-serif', background: 'linear-gradient(135deg, #f8fafc 0%, #f3e8ff 100%)' }}>
        {/* 顶部品牌栏 */}
        <main className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-6xl mx-auto py-12">
            {/* 项目信息区 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {/* 左侧项目信息卡片 */}
              <div className="md:col-span-2 bg-white rounded-2xl shadow p-8 flex flex-col justify-between relative">
                <div>
                  <div className="flex items-center mb-4">
                    <div className="text-2xl font-bold text-gray-800 mr-4">{project.project_name}</div>
                    {project.status === 'processing' && (
                      <span className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs">待评审</span>
                    )}
                    {project.status === 'completed' && (
                      <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs">已完成</span>
                    )}
                  </div>
                  {/* 评分历史按钮 */}
                  <button
                    onClick={handleOpenHistory}
                    className="absolute top-4 right-4 border border-red-400 rounded-lg px-2 py-1 text-red-400 hover:bg-red-50 transition flex items-center"
                    title="查看企业评分历史"
                  >
                    <i className="fa-solid fa-clock-rotate-left mr-1"></i>评分历史
                  </button>
                  <div className="text-gray-500 mb-2"><i className="fa-solid fa-building mr-1"></i> {project.enterprise_name}</div>
                  <div className="text-gray-400 text-sm mb-4">提交时间：{project.created_at?.slice(0, 10)}</div>
                  <div className="mb-4">
                    <a href="#" className="inline-flex items-center text-purple-500 hover:underline text-sm"><i className="fa-solid fa-file-pdf mr-1"></i> 查看BP文档</a>
                  </div>
                  <div className="bg-gray-100 rounded-xl p-4 flex items-center">
                    <i className="fa-solid fa-user-group text-purple-400 text-xl mr-3"></i>
                    <div>
                      <div className="text-gray-700 font-semibold">团队成员：</div>
                      <div className="text-gray-500 text-sm">张三（CEO）、李四（CTO）、王五（COO）</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* 右侧BP文档卡片 */}
              <div className="bg-white rounded-2xl shadow p-8 flex flex-col items-center justify-center">
                <div className="w-full h-64 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-2xl">
                  <i className="fa-solid fa-file-pdf mr-2"></i> BP文档预览
                </div>
                <a href="#" className="mt-4 text-purple-500 hover:underline text-sm flex items-center"><i className="fa-solid fa-download mr-1"></i> 下载BP</a>
              </div>
            </div>
            {/* 评分维度卡片区 */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              {scores.map((score) => {
                const meta = dimensionMeta[score.dimension] || { icon: "fa-star", color: "text-gray-400", text: "text-gray-600" };
                const missing = missingInfo.find((m) => m.dimension === score.dimension);
                const editedScore = editedScores.find(s => s.dimension === score.dimension);
                return (
                  <div key={score.dimension} className="bg-white rounded-2xl shadow p-6 flex flex-col transition-all duration-300 hover:shadow-lg">
                    <div className="flex items-center mb-2">
                      <i className={`fa-solid ${meta.icon} ${meta.color} mr-2`}></i>
                      <span className="font-semibold text-gray-700">{score.dimension}</span>
                      {isEditing ? (
                        <div className="ml-auto flex items-center bg-gray-50 rounded-lg px-2 py-1 border border-gray-200 focus-within:ring-2 focus-within:ring-purple-400 transition-all duration-200 shadow-sm">
                          <input
                            type="number"
                            min="0"
                            max={score.max_score}
                            value={editedScore?.score || score.score}
                            onChange={(e) => handleScoreChange(score.dimension, 'score', Number(e.target.value))}
                            className="w-12 text-center font-bold text-lg bg-transparent outline-none border-none focus:ring-0 text-gray-800"
                          />
                          <span className="mx-1 text-gray-300 text-lg font-normal select-none">/</span>
                          <span className="text-gray-400 text-base font-normal select-none">{score.max_score}</span>
                        </div>
                      ) : (
                        <span className={`ml-auto text-lg font-bold ${meta.text} transition-all duration-300`}>{score.score}/{score.max_score}</span>
                      )}
                    </div>
                    {isEditing ? (
                      <textarea
                        value={editedScore?.comments || score.comments}
                        onChange={(e) => handleScoreChange(score.dimension, 'comments', e.target.value)}
                        className="text-gray-800 text-base mb-2 p-3 rounded-lg border border-gray-200 resize-none w-full focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200 bg-gray-50 hover:bg-white min-h-[80px]"
                        rows={3}
                        placeholder="请输入评语..."
                      />
                    ) : (
                      <div className="text-gray-500 text-sm mb-2 transition-all duration-300">{score.comments}</div>
                    )}
                    {missing && (
                      <div className="text-xs text-yellow-500 mt-2"><i className="fa-solid fa-circle-exclamation mr-1"></i> 缺失：{missing.description}</div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* 底部操作按钮 */}
            <div className="flex justify-end space-x-4">
              {isEditing ? (
                <>
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      setEditedScores(scores);
                    }}
                    className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 font-semibold text-lg hover:bg-gray-50 transition-all duration-200 hover:border-gray-400 flex items-center"
                  >
                    <i className="fa-solid fa-xmark mr-2"></i> 取消
                  </button>
                  <button 
                    onClick={handleSave}
                    className="px-8 py-3 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-400 text-white font-semibold text-lg shadow hover:from-purple-600 hover:to-pink-500 transition-all duration-200 hover:shadow-lg flex items-center"
                  >
                    <i className="fa-solid fa-save mr-2"></i> 保存修改
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 font-semibold text-lg hover:bg-gray-50 transition flex items-center"
                  >
                    <i className="fa-solid fa-pen mr-2"></i> 修改评分
                  </button>
                  <button 
                    onClick={() => router.push(`/projects/${projectId}/report`)}
                    className="px-8 py-3 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-400 text-white font-semibold text-lg shadow hover:from-purple-600 hover:to-pink-500 transition flex items-center"
                  >
                    <i className="fa-solid fa-file-arrow-down mr-2"></i> 下载报告
                  </button>
                </>
              )}
            </div>
          </div>
        </main>
        {/* 企业评分历史弹窗 */}
        {showHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-3xl relative">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                onClick={() => setShowHistory(false)}
              >
                <i className="fa-solid fa-xmark text-2xl"></i>
              </button>
              <div className="text-xl font-bold mb-6 text-gray-800">企业评分历史</div>
              {historyLoading ? (
                <div className="text-center text-gray-600 text-base">加载中...</div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-600 text-base border-b">
                      <th className="py-3 font-semibold">项目名称</th>
                      <th className="py-3 font-semibold">评审时间</th>
                      <th className="py-3 font-semibold">总分</th>
                      <th className="py-3 font-semibold">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyList.length === 0 ? (
                      <tr><td colSpan={4} className="py-6 text-center text-gray-600 text-base">暂无历史记录</td></tr>
                    ) : (
                      historyList.map(item => (
                        <tr key={item.id} className="border-t hover:bg-gray-50">
                          <td className="py-4 text-gray-800 text-base">{item.project_name}</td>
                          <td className="py-4 text-gray-700 text-base">{item.created_at?.slice(0, 10)}</td>
                          <td className="py-4 text-gray-800 text-base font-medium">{item.total_score ?? '--'}</td>
                          <td className="py-4">
                            {item.status === 'completed' && (
                              <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs">已完成</span>
                            )}
                            {item.status === 'processing' && (
                              <span className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs">待评审</span>
                            )}
                            {item.status === '补充信息' && (
                              <span className="inline-block px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs">补充信息</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
        {/* 引入FontAwesome CDN */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </div>
    </Layout>
  );
} 