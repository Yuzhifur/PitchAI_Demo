"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { projectApi, scoreApi, reportApi, businessPlanApi } from "@/lib/api";
import Layout from '@/components/Layout';
import type { Score, MissingInfo, ScoreHistoryItem} from "@/lib/types";
import { getStatusTag } from "@/lib/types";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  // Main states
  const [project, setProject] = useState<any>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [missingInfo, setMissingInfo] = useState<MissingInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Score editing states - SIMPLIFIED AND FIXED
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const originalScoresRef = useRef<Score[]>([]);

  // Other states
  const [processingStatus, setProcessingStatus] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<ScoreHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [bpInfo, setBpInfo] = useState<any>(null);
  const [downloadingBP, setDownloadingBP] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // FIXED: Score change handler with immediate updates and validation
  const handleScoreChange = useCallback((dimension: string, field: 'score' | 'comments', value: string | number) => {
    setScores(currentScores => {
      return currentScores.map(score => {
        if (score.dimension !== dimension) return score;

        if (field === 'score') {
          // Validate score input
          const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
          const validatedScore = Math.max(0, Math.min(numValue, score.max_score));

          return { ...score, score: validatedScore };
        } else {
          // Handle comments
          return { ...score, comments: typeof value === 'string' ? value : String(value) };
        }
      });
    });
  }, []);

  // FIXED: Save handler with proper state management
  const handleSave = useCallback(async () => {
    if (isSaving) return; // Prevent double-saves

    setIsSaving(true);
    setError("");

    try {
      console.log("💾 Saving scores:", scores);

      // Send current scores state to API
      const response = await scoreApi.updateScores(projectId, { dimensions: scores });

      console.log("✅ Save successful, response:", response);

      // Update originalScores ref to new saved state
      originalScoresRef.current = [...scores];

      // Exit editing mode
      setIsEditing(false);

      console.log("✅ Editing mode disabled, save complete");

    } catch (err: any) {
      console.error("❌ Save failed:", err);
      setError(err.response?.data?.message || "保存评分失败");
    } finally {
      setIsSaving(false);
    }
  }, [projectId, scores, isSaving]);

  // FIXED: Cancel handler
  const handleCancel = useCallback(() => {
    console.log("🔄 Canceling edit, restoring original scores");

    // Restore original scores
    setScores([...originalScoresRef.current]);
    setIsEditing(false);
    setError("");
  }, []);

  // FIXED: Edit mode handler
  const handleStartEdit = useCallback(() => {
    console.log("✏️ Starting edit mode, backing up current scores");

    // Backup current scores before editing
    originalScoresRef.current = [...scores];
    setIsEditing(true);
    setError("");
  }, [scores]);

  // FIXED: Score input handler with proper validation
  const handleScoreInputChange = useCallback((dimension: string, inputValue: string) => {
    // Allow empty string for user experience (will be converted to 0)
    if (inputValue === '') {
      handleScoreChange(dimension, 'score', 0);
      return;
    }

    // Parse and validate number
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      handleScoreChange(dimension, 'score', numValue);
    }
    // If invalid input, ignore it (don't update state)
  }, [handleScoreChange]);

  // Initial data loading
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
        originalScoresRef.current = [...scoresRes.data.dimensions]; // Initialize backup
        setMissingInfo(missingInfoRes.data.items);

        // Try to get BP info
        try {
          const bpInfoRes = await businessPlanApi.getInfo(projectId);
          setBpInfo(bpInfoRes.data);
        } catch (bpError) {
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

  // WebSocket for processing status
  useEffect(() => {
    if (project?.status === 'processing') {
      const ws = new WebSocket(`ws://localhost:8000/ws/projects/${projectId}/status`);
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setProcessingStatus(data);
      };
      return () => ws.close();
    }
  }, [project?.status, projectId]);

  // BP download handler
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

  // Report download handler

  // History handlers
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

  // Delete project handler
  const handleDeleteProject = async () => {
    setDeleting(true);
    try {
      await projectApi.delete(projectId);
      setTimeout(() => router.push('/dashboard'), 500);
    } catch (err: any) {
      console.error("Project deletion failed:", err);
      setError(err.response?.data?.message || "删除项目失败，请重试");
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  // Dimension metadata for styling
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
        <main className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-6xl mx-auto py-12">
            {/* Project Information Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {/* Project Info Card */}
              <div className="md:col-span-2 bg-white rounded-2xl shadow p-8 flex flex-col justify-between relative">
                <div>
                  <div className="flex items-center mb-4">
                    <div className="text-2xl font-bold text-gray-800 mr-4">{project.project_name}</div>
                    {(() => {
                      const statusTag = getStatusTag(project.status);
                      return (
                        <span className={statusTag.className}>
                          <i className={`fa-solid ${statusTag.icon} mr-1`}></i>
                          {statusTag.display}
                        </span>
                      );
                    })()}
                  </div>

                  {/* History Button */}
                  <button
                    onClick={handleOpenHistory}
                    className="absolute top-4 right-4 border border-red-400 rounded-lg px-2 py-1 text-red-400 hover:bg-red-50 transition flex items-center"
                    title="查看企业评分历史"
                  >
                    <i className="fa-solid fa-clock-rotate-left mr-1"></i>评分历史
                  </button>

                  <div className="text-gray-500 mb-2">
                    <i className="fa-solid fa-building mr-1"></i> {project.enterprise_name}
                  </div>
                  <div className="text-gray-400 text-sm mb-4">
                    提交时间：{project.created_at?.slice(0, 10)}
                  </div>

                  {/* BP Document Link */}
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

                  {/* Team Info */}
                  <div className="bg-gray-100 rounded-xl p-4 flex items-center">
                    <i className="fa-solid fa-user-group text-purple-400 text-xl mr-3"></i>
                    <div>
                      <div className="text-gray-700 font-semibold">团队成员：</div>
                      <div className="text-gray-500 text-sm">张三（CEO）、李四（CTO）、王五（COO）</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* BP Preview Card */}
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

                {/* Download Button */}
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

            {/* FIXED: Score Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              {scores.map((score) => {
                const meta = dimensionMeta[score.dimension] || { icon: "fa-star", color: "text-gray-400", text: "text-gray-600" };
                const missing = missingInfo.find((m) => m.dimension === score.dimension);

                return (
                  <div key={score.dimension} className="bg-white rounded-2xl shadow p-6 flex flex-col transition-all duration-300 hover:shadow-lg">
                    <div className="flex items-center mb-2">
                      <i className={`fa-solid ${meta.icon} ${meta.color} mr-2`}></i>
                      <span className="font-semibold text-gray-700">{score.dimension}</span>

                      {/* FIXED: Score Input/Display */}
                      {isEditing ? (
                        <div className="ml-auto flex items-center bg-gray-50 rounded-lg px-2 py-1 border border-gray-200 focus-within:ring-2 focus-within:ring-purple-400 transition-all duration-200 shadow-sm">
                          <input
                            type="number"
                            min="0"
                            max={score.max_score}
                            step="0.1"
                            value={score.score}
                            onChange={(e) => handleScoreInputChange(score.dimension, e.target.value)}
                            disabled={isSaving}
                            className="w-12 text-center font-bold text-lg bg-transparent outline-none border-none focus:ring-0 text-gray-800 disabled:opacity-50"
                          />
                          <span className="mx-1 text-gray-300 text-lg font-normal select-none">/</span>
                          <span className="text-gray-400 text-base font-normal select-none">{score.max_score}</span>
                        </div>
                      ) : (
                        <span className={`ml-auto text-lg font-bold ${meta.text} transition-all duration-300`}>
                          {score.score}/{score.max_score}
                        </span>
                      )}
                    </div>

                    {/* FIXED: Comments Input/Display */}
                    {isEditing ? (
                      <textarea
                        value={score.comments || ''}
                        onChange={(e) => handleScoreChange(score.dimension, 'comments', e.target.value)}
                        disabled={isSaving}
                        className="text-gray-800 text-base mb-2 p-3 rounded-lg border border-gray-200 resize-none w-full focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200 bg-gray-50 hover:bg-white min-h-[80px] disabled:opacity-50"
                        rows={3}
                        placeholder="请输入评语..."
                      />
                    ) : (
                      <div className="text-gray-500 text-sm mb-2 transition-all duration-300">
                        {score.comments || '暂无评语'}
                      </div>
                    )}

                    {/* Missing Info Warning */}
                    {missing && (
                      <div className="text-xs text-yellow-500 mt-2">
                        <i className="fa-solid fa-circle-exclamation mr-1"></i> 缺失：{missing.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* FIXED: Action Buttons */}
            <div className="flex justify-end space-x-4">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 font-semibold text-lg hover:bg-gray-50 transition-all duration-200 hover:border-gray-400 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className="fa-solid fa-xmark mr-2"></i> 取消
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-8 py-3 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-400 text-white font-semibold text-lg shadow hover:from-purple-600 hover:to-pink-500 transition-all duration-200 hover:shadow-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className={`fa-solid ${isSaving ? 'fa-spinner fa-spin' : 'fa-save'} mr-2`}></i>
                    {isSaving ? '保存中...' : '保存修改'}
                  </button>
                </>
              ) : (
                <>
                  {/* Delete Project Button */}
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deleting}
                    className="px-6 py-3 rounded-xl border border-red-300 text-red-600 font-semibold text-lg hover:bg-red-50 transition-all duration-200 hover:border-red-400 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className={`fa-solid ${deleting ? 'fa-spinner fa-spin' : 'fa-trash'} mr-2`}></i>
                    {deleting ? '删除中...' : '删除项目'}
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={handleStartEdit}
                    className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 font-semibold text-lg hover:bg-gray-50 transition flex items-center"
                  >
                    <i className="fa-solid fa-pen mr-2"></i> 修改评分
                  </button>

                  {/* Download Report Button */}
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

        {/* History Modal - kept same as before */}
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

        {/* Delete Confirmation Modal - kept same as before */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-exclamation-triangle text-red-500 text-2xl"></i>
                </div>

                <div className="text-xl font-bold text-gray-800 mb-2">确认删除项目</div>

                <div className="text-gray-600 mb-2">您即将删除以下项目：</div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="font-semibold text-gray-800">{project?.project_name}</div>
                  <div className="text-sm text-gray-600">{project?.enterprise_name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    创建时间：{project?.created_at?.slice(0, 10)}
                  </div>
                </div>

                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                  <i className="fa-solid fa-warning mr-2"></i>
                  <strong>警告：</strong>此操作无法撤销！删除后将永久移除项目的所有数据。
                </div>

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

        {/* FontAwesome CDN */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </div>
    </Layout>
  );
}