import React from "react";
import { Mail, Send } from "lucide-react";

interface EmptyStateProps {
  type: "scheduled" | "sent";
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type, onAction }) => {
  const content = {
    scheduled: {
      icon: Mail,
      title: "No scheduled emails",
      description: "Start by composing and scheduling your first email campaign",
      actionText: "Compose Email",
    },
    sent: {
      icon: Send,
      title: "No sent emails yet",
      description: "Emails you schedule will appear here once they're sent",
      actionText: null,
    },
  };

  const { icon: Icon, title, description, actionText } = content[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-gray-100 rounded-full p-6 mb-4">
        <Icon className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-center max-w-md mb-6">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};