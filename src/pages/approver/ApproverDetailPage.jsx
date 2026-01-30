import React, { useState, useEffect } from "react";
import deferralService from '../../service/localDeferralService';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, Row, Col, Button, Tag, Typography, Steps, Descriptions, Table, List, Avatar, Modal, Input, Space, Alert, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, InfoCircleOutlined, FormOutlined, FilePdfOutlined, FileWordOutlined, FileExcelOutlined, FileImageOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Step } = Steps;
const { TextArea } = Input;

// Mock fallback for development
const MOCK_APPROVER_REVIEW_DATA = {
  _id: 'demo-detail-1',
  deferralNumber: 'DEF-XXXX-000',
  dclNo: 'DCL-DEMO-001',
  customerNumber: '000000',
  customerName: 'Demo Customer',
  businessName: 'Demo Business Ltd.',
  loanType: 'asset finance',
  deferralDescription: 'This is a demo deferral payload used when no deferral is found locally (development only).',
  deferralType: 'New',
  status: 'deferral_requested',
  daysSought: 30,
  nextDueDate: new Date().toISOString(),
  approverFlow: ['Demo Approver 1', 'Demo Approver 2'],
  currentApprover: 'Demo Approver 1',
  currentApproverIndex: 0,
  dclFile: { name: 'dcl_document.pdf', size: '1.2 MB', url: '#' },
  additionalFiles: [],
  history: [
    { action: 'Requested', user: 'Demo RM', date: new Date().toISOString(), notes: 'Demo request', userRole: 'RM' }
  ]
};

const getFileIcon = (fileName) => {
  const ext = (fileName || '').split('.').pop().toLowerCase();
  switch (ext) {
    case 'pdf': return <FilePdfOutlined />;
    case 'doc':
    case 'docx': return <FileWordOutlined />;
    case 'xls':
    case 'xlsx': return <FileExcelOutlined />;
    case 'png':
    case 'jpg':
    case 'jpeg': return <FileImageOutlined />;
    default: return <FilePdfOutlined />;
  }
};

export default function ApproverDetailPage() {
  const { deferralId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [deferralData, setDeferralData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewerApproverIndex, setViewerApproverIndex] = useState(null);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const q = new URLSearchParams(location.search);
        const approverParam = q.get('approver');
        if (approverParam) {
          const num = parseInt(approverParam, 10);
          if (!isNaN(num)) setViewerApproverIndex(num - 1);
        }

        // Try by deferral number then id
        const foundByNumber = await deferralService.findByDeferralNumber(deferralId);
        const foundById = await deferralService.findById(deferralId);
        let found = foundByNumber || foundById;

        if (!found) {
          // try preview payloads: ?preview=base64 or ?payload=...
          const previewB64 = q.get('preview') || q.get('payload') || q.get('preview64');
          if (previewB64) {
            try {
              // Try multiple decoding strategies (URL-encoded base64, raw base64, raw JSON)
              const decoders = [
                (v) => atob(v),
                (v) => atob(decodeURIComponent(v)),
                (v) => decodeURIComponent(v)
              ];
              let parsed = null;
              for (const fn of decoders) {
                try {
                  const candidate = fn(previewB64);
                  parsed = JSON.parse(candidate);
                  break;
                // eslint-disable-next-line no-unused-vars
                } catch (err) {
                  // continue
                }
              }

              if (parsed && parsed.deferralNumber) {
                parsed._id = parsed._id || `preview-${Date.now()}`;
                parsed.approverFlow = parsed.approverFlow || parsed.approvers || [];
                parsed.currentApproverIndex = parsed.currentApproverIndex || 0;
                parsed.createdAt = parsed.createdAt || new Date().toISOString();
                deferralService.addDeferral(parsed);
                found = parsed;
              }
            } catch (err) {
              console.error('Failed to parse preview payload', err);
            }
          }
        }

        // If still not found but running locally or ?mock=1, use mock
        if (!found) {
          const q2 = new URLSearchParams(location.search || window.location.search);
          const useMock = q2.get('mock') === '1' || (typeof window !== 'undefined' && window.location && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));
          if (useMock) {
            const mock = { ...MOCK_APPROVER_REVIEW_DATA, deferralNumber: deferralId };
            mock._id = mock._id || `mock-${Date.now()}`;
            const existing = await deferralService.findByDeferralNumber(mock.deferralNumber);
            if (!existing) deferralService.addDeferral(mock);
            found = mock;
            console.info('[ApproverDetailPage] Using mock deferral for', deferralId);
          }
        }

        if (mounted) setDeferralData(found || null);
      } catch (err) {
        console.error('Failed to load deferral', err);
        if (mounted) setDeferralData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [deferralId, location.search]);

  const effectiveViewerIndex = viewerApproverIndex !== null ? viewerApproverIndex : (deferralData?.currentApproverIndex ?? 0);
  const isViewerCurrent = deferralData && effectiveViewerIndex === deferralData.currentApproverIndex;
  const isLastApprover = deferralData && deferralData.currentApproverIndex >= (deferralData.approverFlow?.length || 0) - 1;

  const formatApproverName = (a) => {
    if (!a) return '';
    if (typeof a === 'string') return a;
    return a.name || String(a);
  };

  const handleApprove = async () => {
    if (!deferralData) return;
    setIsSubmitting(true);
    try {
      const newEntry = {
        action: 'Approved',
        user: formatApproverName(deferralData.approverFlow[effectiveViewerIndex]) || 'Approver',
        date: new Date().toISOString(),
        comment: newComment
      };
      const nextIndex = (deferralData.currentApproverIndex || 0) + 1;
      const updated = {
        ...deferralData,
        history: [...(deferralData.history || []), newEntry],
        currentApproverIndex: nextIndex,
        currentApprover: deferralData.approverFlow?.[nextIndex] || 'Completed',
        status: nextIndex >= (deferralData.approverFlow?.length || 0) ? 'deferral_approved' : 'deferral_requested'
      };
      await deferralService.updateDeferral(updated);
      setDeferralData(updated);
      setApproveModalVisible(false);
      setNewComment('');
      message.success('Deferral approved');

      // Notify next approver via email server if there is one
      if (updated.status !== 'deferral_approved') {
        const serverUrl = (process.env.EMAIL_SERVER_URL) || `${window.location.protocol}//${window.location.hostname}:4001`;
        try {
          await fetch(`${serverUrl}/api/send-deferral`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deferralNumber: updated.deferralNumber, targetApproverPosition: updated.currentApproverIndex + 1, to: (updated.currentApprover && updated.currentApprover.email) || undefined })
          });
        } catch (err) {
          console.warn('Failed to notify next approver via email server', err);
        }
      }
    } catch (err) {
      console.error(err);
      message.error('Approval failed');
    } finally { setIsSubmitting(false); }
  };

  const handleReject = async () => {
    if (!deferralData) return;
    setIsSubmitting(true);
    try {
      const newEntry = {
        action: 'Rejected',
        user: formatApproverName(deferralData.approverFlow[effectiveViewerIndex]) || 'Approver',
        date: new Date().toISOString(),
        comment: newComment
      };
      const updated = {
        ...deferralData,
        history: [...(deferralData.history || []), newEntry],
        status: 'deferral_rejected'
      };
      await deferralService.updateDeferral(updated);
      setDeferralData(updated);
      setRejectModalVisible(false);
      setNewComment('');
      message.success('Deferral rejected');
    } catch (err) {
      console.error(err);
      message.error('Rejection failed');
    } finally { setIsSubmitting(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Card style={{ textAlign: 'center', padding: 40 }}>
        <Title level={3}>Loading Deferral Request...</Title>
        <Text type="secondary">Fetching deferral details</Text>
      </Card>
    </div>
  );

  if (!deferralData) return (
    <div style={{ padding: 24 }}>
      <Card style={{ textAlign: 'center', padding: 40 }}>
        <Title level={3}>Deferral Not Found</Title>
        <Text type="secondary">The deferral request you're looking for doesn't exist in this environment.</Text>
        <div style={{ marginTop: 12 }}>
          <Button onClick={() => navigate('/')}>Home</Button>
        </div>
      </Card>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <Card style={{ marginBottom: 24, borderLeft: `4px solid #faad14` }}>
        <Row justify="space-between" align="middle">
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Title level={3} style={{ margin: 0 }}>{deferralData.deferralNumber} — {deferralData.customerName}</Title>
              <Tag color={deferralData.status === 'deferral_approved' ? '#52c41a' : deferralData.status === 'deferral_rejected' ? '#ff4d4f' : '#faad14'}>{deferralData.status}</Tag>
            </div>
            <Text type="secondary">Requested: {dayjs(deferralData.createdAt).format('DD MMM YYYY HH:mm')}</Text>
          </Col>
          <Col>
            <Space>
              <Button onClick={() => navigate('/')} >Home</Button>
              <Button type="primary" icon={<FormOutlined />} onClick={() => setCommentModalVisible(true)}>Add Comment</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[24,24]}>
        <Col span={16}>
          <Card style={{ marginBottom: 16 }} title="Customer & Deferral Info">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Customer Name">{deferralData.customerName}</Descriptions.Item>
              <Descriptions.Item label="DCL Number">{deferralData.dclNo}</Descriptions.Item>
              <Descriptions.Item label="Loan Type">{deferralData.loanType}</Descriptions.Item>
              <Descriptions.Item label="Days Sought">{deferralData.daysSought}</Descriptions.Item>
              <Descriptions.Item label="Next Due">{dayjs(deferralData.nextDueDate).format('DD MMM YYYY')}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card style={{ marginBottom: 16 }} title="RM's Reason">
            <Text>{deferralData.deferralDescription}</Text>
          </Card>

          <Card style={{ marginBottom: 16 }} title={`Selected Documents (${deferralData.selectedDocuments?.length || 0})`}>
            {deferralData.selectedDocuments && deferralData.selectedDocuments.length > 0 ? (
              <Table dataSource={deferralData.selectedDocuments} rowKey={(r,i) => i} pagination={false} columns={[{ title: 'Name', dataIndex: 'name' }, { title: 'Category', dataIndex: 'category', render: c => <Tag>{c}</Tag> }]} />
            ) : (
              <div style={{ textAlign: 'center', padding: 18 }}>No documents selected</div>
            )}
          </Card>

          <Card title="Comment History">
            {(!deferralData.history || deferralData.history.length === 0) ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#888' }}>No comments yet</div>
            ) : (
              <List dataSource={deferralData.history} renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta avatar={<Avatar />} title={<div><Text strong>{item.user}</Text> <Text type="secondary">{dayjs(item.date).format('DD MMM YYYY HH:mm')}</Text></div>} description={item.comment || item.notes} />
                </List.Item>
              )} />
            )}
          </Card>
        </Col>

        <Col span={8}>
          <Card style={{ marginBottom: 16 }} title="Approval Flow">
            <Steps current={deferralData.currentApproverIndex} direction="vertical">
              {deferralData.approverFlow?.map((a, idx) => (
                <Step key={idx} title={formatApproverName(a)} description={idx === deferralData.currentApproverIndex ? 'Current' : idx < deferralData.currentApproverIndex ? 'Completed' : 'Pending'} />
              ))}
            </Steps>
          </Card>

          <Card style={{ marginBottom: 16 }} title="Uploaded Documents">
            {deferralData.dclFile ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{getFileIcon(deferralData.dclFile.name)} <div><Text strong>{deferralData.dclFile.name}</Text><div style={{ fontSize: 12, color: '#666' }}>{dayjs(deferralData.dclFile.uploadDate || deferralData.createdAt).format('DD MMM YYYY')}</div></div></div>
                <Space>
                  <Button icon={<EyeOutlined />} onClick={() => {
                    const url = deferralData.dclFile.dataUrl || deferralData.dclFile.url || '#';
                    if (url === '#') return;
                    window.open(url);
                  }} />
                  <Button icon={<DownloadOutlined />} onClick={() => {
                    const url = deferralData.dclFile.dataUrl || deferralData.dclFile.url || null;
                    if (!url) return;
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = deferralData.dclFile.name || 'file';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                  }} />
                </Space>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 12 }}>No DCL uploaded</div>
            )}

            {deferralData.additionalFiles && deferralData.additionalFiles.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <Title level={5}>Additional Attachments</Title>
                <List dataSource={deferralData.additionalFiles} renderItem={(file) => (
                  <List.Item>
                    <List.Item.Meta avatar={<Avatar icon={getFileIcon(file.name)} />} title={<div><Text strong>{file.name}</Text> <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>{file.size ? file.size : ''}</Text></div>} description={file.type} />
                    <Space>
                      <Button onClick={() => { const url = file.dataUrl || file.url || '#'; if (url === '#') return; window.open(url); }} icon={<EyeOutlined />} />
                      <Button onClick={() => { const url = file.dataUrl || file.url || null; if (!url) return; const a = document.createElement('a'); a.href = url; a.download = file.name || 'file'; document.body.appendChild(a); a.click(); a.remove(); }} icon={<DownloadOutlined />} />
                    </Space>
                  </List.Item>
                )} />
              </div>
            )}
          </Card>

          <Card title="Your Decision">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="primary" block onClick={() => setApproveModalVisible(true)} disabled={!isViewerCurrent || deferralData.status !== 'deferral_requested'} icon={<CheckCircleOutlined />}>Approve</Button>
              <Button danger block onClick={() => setRejectModalVisible(true)} disabled={!isViewerCurrent || deferralData.status !== 'deferral_requested'} icon={<CloseCircleOutlined />}>Reject</Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Modal title="Approve Deferral" open={approveModalVisible} onCancel={() => setApproveModalVisible(false)} footer={[<Button key="cancel" onClick={() => setApproveModalVisible(false)}>Cancel</Button>, <Button key="ok" type="primary" loading={isSubmitting} onClick={handleApprove}>Confirm</Button>] }>
        <TextArea rows={4} value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Optional comment" />
      </Modal>

      <Modal title="Reject Deferral" open={rejectModalVisible} onCancel={() => setRejectModalVisible(false)} footer={[<Button key="cancel" onClick={() => setRejectModalVisible(false)}>Cancel</Button>, <Button key="reject" danger loading={isSubmitting} onClick={handleReject}>Reject</Button>] }>
        <TextArea rows={4} value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Reason for rejection" />
      </Modal>

      <Modal title="Add Comment" open={commentModalVisible} onCancel={() => setCommentModalVisible(false)} footer={[<Button key="cancel" onClick={() => setCommentModalVisible(false)}>Cancel</Button>, <Button key="add" type="primary" onClick={async () => { if (!newComment.trim()) return message.warning('Enter a comment'); const entry = { action: 'Comment', user: 'Approver', date: new Date().toISOString(), comment: newComment }; const updated = { ...deferralData, history: [...(deferralData.history||[]), entry] }; await deferralService.updateDeferral(updated); setDeferralData(updated); setNewComment(''); setCommentModalVisible(false); message.success('Comment added'); }}>Add</Button>] }>
        <TextArea rows={4} value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Enter comment" />
      </Modal>
    </div>
  );
}