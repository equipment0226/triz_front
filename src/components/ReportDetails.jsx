import React, { useId, useState } from 'react';
import './ReportDetails.css';

export function ReportDetails({ title = '상세 분석 기록', children }) {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  return <div className="report-details">
    <div className="report-details-heading">
      <strong>{title}</strong>
      <button type="button" aria-expanded={open} aria-controls={contentId}
        onClick={() => setOpen(value => !value)}>{open ? '접기' : '펼치기'}</button>
    </div>
    {open && <div id={contentId} className="report-details-content">{children}</div>}
  </div>;
}
