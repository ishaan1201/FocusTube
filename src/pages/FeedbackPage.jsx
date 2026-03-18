import { useState } from "react";
import FeedbackForm from "../components/FeedbackForm";

export default function FeedbackPage() {
  const [showForm, setShowForm] = useState(true);

  if (!showForm) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-bold mb-4">Feedback Sent!</h1>
        <p className="text-zinc-500 mb-8 text-center">Thank you for helping us improve FocusTube.</p>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-zinc-200 transition-all"
        >
          Send More Feedback
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Feedback</h1>
      <FeedbackForm onClose={() => setShowForm(false)} />
    </div>
  );
}
