import React from 'react';
export function DataState({ loading,error,empty,onRetry,children }) {
  if (loading) return <p role="status">Đang tải dữ liệu…</p>;
  if (error) return <div role="alert" className="notice">{error.message} <button onClick={onRetry}>Thử lại</button></div>;
  if (empty) return <p className="notice">Chưa có dữ liệu. Hãy tạo mẫu và lời mời khảo sát để bắt đầu.</p>;
  return children;
}
