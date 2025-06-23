"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { projectApi, scoreApi, reportApi, businessPlanApi } from "@/lib/api";
import Layout from '@/components/Layout';
import type { Score, MissingInfo, ScoreHistoryItem } from "@/lib/types";

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
  const [historyList, setHistoryList] = useState<ScoreHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [bpInfo, setBpInfo] = useState<any>(null);
  const [downloadingBP, setDownloadingBP] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

        // Try to get BP info - don't fail if it doesn't exist
        try {
          const bpInfoRes = await businessPlanApi.getInfo(projectId);
          setBpInfo(bpInfoRes.data);
        } catch (bpError) {
          // BP not found is OK, just means no file uploaded yet
          console.log("No BP found for project:", projectId);
        }
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

  // Add this function to handle BP download
  const handleDownloadBP = async () => {
    if (!bpInfo?.file_exists) {
      setError("商业计划书文件不存在");
      return;
    }

    setDownloadingBP(true);
    try {
      await businessPlanApi.downloadAndSave(projectId, bpInfo.file_name);
    } catch (err: any) {
      setError(err.response?.data?.message || '下载文件失败');
    } finally {
      setDownloadingBP(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const response = await reportApi.downloadReport(projectId);
      const url = window.URL.createObjectURL(new Blob([response]));
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

  const handleScoreInputChange = (dimension: string, inputValue: string) => {
    // Handle both typing and increment/decrement arrows
    const numValue = inputValue === '' ? 0 : Number(inputValue);

    // Only update if it's a valid number
    if (!isNaN(numValue)) {
      handleScoreChange(dimension, 'score', numValue);
    }
  };

  const handleViewBP = async () => {
    try {
      // First check if BP exists
      const statusResponse = await businessPlanApi.getStatus(projectId);

      if (statusResponse.data.status === 'completed') {
        // Open BP in new tab
        const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/projects/${projectId}/business-plans/download`;
        window.open(downloadUrl, '_blank');
      } else {
        setError('BP文档尚未上传或处理中');
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('未找到BP文档，请先上传BP文档');
      } else {
        setError('无法查看BP文档，请稍后重试');
      }
    }
  };

  const handleSave = async () => {
    try {
      await scoreApi.updateScores(projectId, { dimensions: editedScores });
      setScores(editedScores);
      setIsEditing(false);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "保存评分失败");
    }
  };

  const handleOpenHistory = async () => {
    setShowHistory(true);
    setHistoryLoading(true);
    try {
      const response = await scoreApi.getScoreHistory(projectId);
      setHistoryList(response.data.history || []);
    } catch (err: any) {
      console.error("Failed to fetch score history:", err);
      if (err.response?.status === 404) {
        setHistoryList([]);
      } else {
        setError("获取评分历史失败");
        setHistoryList([]);
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDeleteProject = async () => {
  setDeleting(true);
  try {
    await projectApi.delete(projectId);

    // Show success message briefly before redirecting
    setError(""); // Clear any existing errors

    // Redirect to dashboard after successful deletion
    setTimeout(() => {
      router.push('/dashboard');
    }, 500);

  } catch (err: any) {
    console.error("Project deletion failed:", err);
    setError(err.response?.data?.message || "删除项目失败，请重试");
    setShowDeleteConfirm(false); // Close confirmation dialog on error
  } finally {
    setDeleting(false);
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
                    {bpInfo?.file_exists ? (
                      <button
                        onClick={handleDownloadBP}
                        disabled={downloadingBP}
                        className="inline-flex items-center text-purple-500 hover:underline text-sm disabled:opacity-50"
                      >
                        <i className={`fa-solid ${downloadingBP ? 'fa-spinner fa-spin' : 'fa-file-pdf'} mr-1`}></i>
                        {downloadingBP ? '下载中...' : '查看BP文档'}
                      </button>
                    ) : (
                      <span className="inline-flex items-center text-gray-400 text-sm">
                        <i className="fa-solid fa-file-pdf mr-1"></i> 暂无BP文档
                      </span>
                    )}
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
                  <div className="text-center">
                    <i className="fa-solid fa-file-pdf mr-2"></i>
                    <div className="text-sm mt-2">
                      {bpInfo?.file_exists ? `${bpInfo.file_name}` : 'BP文档预览'}
                    </div>
                    {bpInfo?.file_size && (
                      <div className="text-xs text-gray-500 mt-1">
                        {Math.round(bpInfo.file_size / 1024 / 1024 * 100) / 100} MB
                      </div>
                    )}
                  </div>
                </div>
                {/* Download button goes here */}
                {bpInfo?.file_exists ? (
                  <button
                    onClick={handleDownloadBP}
                    disabled={downloadingBP}
                    className="mt-4 text-purple-500 hover:underline text-sm flex items-center disabled:opacity-50"
                  >
                    <i className={`fa-solid ${downloadingBP ? 'fa-spinner fa-spin' : 'fa-download'} mr-1`}></i>
                    {downloadingBP ? '下载中...' : '下载BP'}
                  </button>
                ) : (
                  <span className="mt-4 text-gray-400 text-sm flex items-center">
                    <i className="fa-solid fa-download mr-1"></i> 暂无文件
                  </span>
                )}
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
                            step="1"
                            value={editedScore?.score ?? score.score}
                            // Handle both onChange and onInput for better browser compatibility
                            onChange={(e) => handleScoreInputChange(score.dimension, e.target.value)}
                            onInput={(e) => handleScoreInputChange(score.dimension, (e.target as HTMLInputElement).value)}
                            // Add onBlur to ensure value is validated when user leaves the field
                            onBlur={(e) => {
                              const value = e.target.value;
                              const numValue = value === '' ? 0 : Number(value);
                              if (!isNaN(numValue)) {
                                const maxScore = score.max_score;
                                const validatedScore = Math.max(0, Math.min(numValue, maxScore));
                                handleScoreChange(score.dimension, 'score', validatedScore);
                                // Force the input to show the validated value
                                e.target.value = validatedScore.toString();
                              }
                            }}
                            className="w-12 text-center font-bold text-lg bg-transparent outline-none border-none focus:ring-0 text-gray-800"
                            style={{
                              // Ensure the spinner arrows are visible and functional
                              MozAppearance: 'textfield'
                            }}
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
                  {/* 删除项目按钮 */}
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deleting}
                    className="px-6 py-3 rounded-xl border border-red-300 text-red-600 font-semibold text-lg hover:bg-red-50 transition-all duration-200 hover:border-red-400 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className={`fa-solid ${deleting ? 'fa-spinner fa-spin' : 'fa-trash'} mr-2`}></i>
                    {deleting ? '删除中...' : '删除项目'}
                  </button>
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
            <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-4xl max-h-[80vh] overflow-hidden relative">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                onClick={() => setShowHistory(false)}
              >
                <i className="fa-solid fa-xmark text-2xl"></i>
              </button>

              <div className="text-xl font-bold mb-6 text-gray-800 flex items-center">
                <i className="fa-solid fa-clock-rotate-left text-purple-500 mr-2"></i>
                评分变更历史
              </div>

              <div className="text-sm text-gray-600 mb-4">
                项目：{project?.project_name} | 企业：{project?.enterprise_name}
              </div>

              {historyLoading ? (
                <div className="text-center text-gray-600 text-base py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                  加载历史记录中...
                </div>
              ) : historyList.length === 0 ? (
                <div className="text-center text-gray-600 text-base py-8">
                  <i className="fa-solid fa-history text-4xl text-gray-300 mb-4"></i>
                  <div>暂无评分变更历史</div>
                  <div className="text-sm text-gray-400 mt-2">首次评分后将在此显示历史记录</div>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-96">
                  <div className="space-y-4">
                    {historyList.map((historyItem, index) => (
                      <div key={historyItem.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <span className="inline-block w-6 h-6 bg-purple-100 text-purple-600 rounded-full text-xs flex items-center justify-center font-semibold mr-3">
                              {index + 1}
                            </span>
                            <div>
                              <div className="font-semibold text-gray-800">
                                总分：{historyItem.total_score}/100
                              </div>
                              <div className="text-xs text-gray-500">
                                {historyItem.modification_notes || '评分更新'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">
                              {new Date(historyItem.created_at).toLocaleDateString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            <div className="text-xs text-gray-400">
                              修改人：{historyItem.modified_by}
                            </div>
                          </div>
                        </div>

                        {/* Show dimension breakdown for this history entry */}
                        <div className="grid grid-cols-5 gap-2 text-xs">
                          {Object.entries(historyItem.dimensions || {}).map(([dimName, dimData]: [string, any]) => (
                            <div key={dimName} className="bg-gray-100 rounded p-2">
                              <div className="font-semibold text-gray-700">{dimName}</div>
                              <div className="text-purple-600">{dimData.score}/{dimData.max_score}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-4 border-t flex justify-end">
                <button
                  onClick={() => setShowHistory(false)}
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
        {/* 删除确认对话框 */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
              <div className="text-center">
                {/* Warning Icon */}
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-exclamation-triangle text-red-500 text-2xl"></i>
                </div>

                {/* Title */}
                <div className="text-xl font-bold text-gray-800 mb-2">确认删除项目</div>

                {/* Warning Message */}
                <div className="text-gray-600 mb-2">
                  您即将删除以下项目：
                </div>

                {/* Project Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="font-semibold text-gray-800">{project?.project_name}</div>
                  <div className="text-sm text-gray-600">{project?.enterprise_name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    创建时间：{project?.created_at?.slice(0, 10)}
                  </div>
                </div>

                {/* Warning Text */}
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                  <i className="fa-solid fa-warning mr-2"></i>
                  <strong>警告：</strong>此操作无法撤销！删除后将永久移除项目的所有数据，包括评分记录、BP文档和历史记录。
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleDeleteProject}
                    disabled={deleting}
                    className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center"
                  >
                    <i className={`fa-solid ${deleting ? 'fa-spinner fa-spin' : 'fa-trash'} mr-2`}></i>
                    {deleting ? '删除中...' : '确认删除'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* 引入FontAwesome CDN */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </div>
    </Layout>
  );
}