'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Tools() {
  const [feedback, setFeedback] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const handleSubmitFeedback = () => {
    if (feedback.trim()) {
      setFeedbackSent(true);
      setFeedback('');
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center p-8 bg-background overflow-y-auto">
      <div className="max-w-4xl w-full flex flex-col items-center gap-8 mt-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-surface border border-border text-text-secondary">New Release</span>
          <h1 className="text-3xl font-bold text-text-primary">Browse Trading Tools</h1>
          <p className="text-text-secondary">We've built you a suite of trading tools to help you become a better trader.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-8">
          <Link
            href="/tools/forex"
            className="bg-surface border border-border rounded-xl p-6 hover:border-text-secondary transition-colors cursor-pointer group block"
          >
            <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent transition-colors">Forex Position Size</h3>
            <p className="text-sm text-text-secondary mt-2">Calculate position size and risk for forex pairs</p>
          </Link>
          <Link
            href="/tools/futures"
            className="bg-surface border border-border rounded-xl p-6 hover:border-text-secondary transition-colors cursor-pointer group block"
          >
            <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent transition-colors">Futures Position Size</h3>
            <p className="text-sm text-text-secondary mt-2">Evaluate trading risks and potential returns</p>
          </Link>
        </div>

        <div className="bg-surface border border-border rounded-xl p-8 w-full mt-4 flex flex-col md:flex-row gap-8 justify-between items-start">
          <div className="flex flex-col gap-2 max-w-md">
            <h3 className="text-xl font-bold text-text-primary">Are we missing something?</h3>
            <p className="text-text-secondary">We're always looking to improve. Let us know what you'd like to see!</p>
          </div>
          <div className="flex flex-col gap-4 w-full md:w-80 shrink-0">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full h-24 bg-background border border-border rounded-lg p-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent resize-none"
              placeholder="Please enter your feedback here..."
              disabled={feedbackSent}
            />
            <button
              type="button"
              onClick={handleSubmitFeedback}
              disabled={feedbackSent || !feedback.trim()}
              className="w-full py-2.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {feedbackSent ? 'Thank you!' : 'Submit Feedback'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
