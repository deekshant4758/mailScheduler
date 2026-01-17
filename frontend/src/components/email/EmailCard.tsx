"use client";

import { EmailRecord } from "@/types";
// import { formatDate } from "@/lib/utils";
import { formatDate } from "@/lib/util";
import { Clock, CheckCircle, XCircle, Loader, Mail, X, Calendar } from "lucide-react";
import { useState } from "react";

interface EmailCardProps {
  email: EmailRecord;
}

export const EmailCard: React.FC<EmailCardProps> = ({ email }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Clock className="w-4 h-4 text-orange-500" />;
      case "queued":
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      case "sent":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "queued":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "sent":
        return "bg-green-50 text-green-700 border-green-200";
      case "failed":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <>
      {/* Email Card in List */}
      <div
        onClick={() => setIsOpen(true)}
        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-green-700">
                {email.recipientEmail.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {email.recipientEmail}
              </p>
              <p className="text-xs text-gray-500">
                To: {email.recipientEmail}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${getStatusColor(
              email.status
            )}`}
          >
            {getStatusIcon(email.status)}
            {email.status.charAt(0).toUpperCase() + email.status.slice(1)}
          </span>
        </div>

        <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-1">
          {email.subject}
        </h3>

        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {email.body.replace(/<[^>]*>/g, "")}
        </p>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>
              {email.status === "sent" && email.sentAt
                ? `Sent ${formatDate(email.sentAt)}`
                : `Scheduled ${formatDate(email.scheduledAt)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Email Detail Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Mail className="w-6 h-6 text-green-700" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {email.subject}
                  </h2>
                  <p className="text-sm text-gray-500">Email ID: {email.id}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Email Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Status
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      email.status
                    )}`}
                  >
                    {getStatusIcon(email.status)}
                    {email.status.charAt(0).toUpperCase() +
                      email.status.slice(1)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    From
                  </span>
                  <span className="text-sm text-gray-900">
                    {email.senderEmail}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">To</span>
                  <span className="text-sm text-gray-900">
                    {email.recipientEmail}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Scheduled At
                  </span>
                  <span className="text-sm text-gray-900">
                    {formatDate(email.scheduledAt)}
                  </span>
                </div>

                {email.sentAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Sent At
                    </span>
                    <span className="text-sm text-gray-900">
                      {formatDate(email.sentAt)}
                    </span>
                  </div>
                )}

                {email.errorMessage && (
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium text-red-700">
                      Error
                    </span>
                    <span className="text-sm text-red-600 text-right max-w-xs">
                      {email.errorMessage}
                    </span>
                  </div>
                )}
              </div>

              {/* Email Body */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Email Content
                </h3>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  {email.body.includes("<") ? (
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: email.body }}
                    />
                  ) : (
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {email.body}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-2.5 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};