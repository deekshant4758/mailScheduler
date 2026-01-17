"use client";

import { EmailRecord } from "@/types";
// import { formatDate } from "@/lib/utils";
import { formatDate } from "@/lib/util";
import { Clock, CheckCircle, XCircle, Loader, Mail, X, Calendar } from "lucide-react";
import { useState } from "react";

interface EmailListProps {
  emails: EmailRecord[];
  type: "scheduled" | "sent";
}

export const EmailList: React.FC<EmailListProps> = ({ emails, type }) => {
  const [selectedEmail, setSelectedEmail] = useState<EmailRecord | null>(null);

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
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {type === "scheduled" ? "Scheduled Time" : "Sent Time"}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {emails.map((email) => (
                <tr
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-green-700">
                          {email.recipientEmail.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {email.recipientEmail.split("@")[0]}
                        </p>
                        <p className="text-xs text-gray-500">
                          {email.recipientEmail}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900 font-medium line-clamp-1">
                      {email.subject}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                      {email.body.replace(/<[^>]*>/g, "")}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          type === "scheduled"
                            ? "bg-orange-50 text-orange-700"
                            : "bg-gray-50 text-gray-700"
                        }`}
                      >
                        {type === "scheduled" ? (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(email.scheduledAt)}
                          </>
                        ) : email.sentAt ? (
                          formatDate(email.sentAt)
                        ) : (
                          "N/A"
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        email.status
                      )}`}
                    >
                      {getStatusIcon(email.status)}
                      {email.status.charAt(0).toUpperCase() +
                        email.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Detail Modal */}
      {selectedEmail && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEmail(null)}
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
                    {selectedEmail.subject}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Email ID: {selectedEmail.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
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
                      selectedEmail.status
                    )}`}
                  >
                    {getStatusIcon(selectedEmail.status)}
                    {selectedEmail.status.charAt(0).toUpperCase() +
                      selectedEmail.status.slice(1)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    From
                  </span>
                  <span className="text-sm text-gray-900">
                    {selectedEmail.senderEmail}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">To</span>
                  <span className="text-sm text-gray-900">
                    {selectedEmail.recipientEmail}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Scheduled At
                  </span>
                  <span className="text-sm text-gray-900">
                    {formatDate(selectedEmail.scheduledAt)}
                  </span>
                </div>

                {selectedEmail.sentAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Sent At
                    </span>
                    <span className="text-sm text-gray-900">
                      {formatDate(selectedEmail.sentAt)}
                    </span>
                  </div>
                )}

                {selectedEmail.errorMessage && (
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium text-red-700">
                      Error
                    </span>
                    <span className="text-sm text-red-600 text-right max-w-xs">
                      {selectedEmail.errorMessage}
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
                  {selectedEmail.body.includes("<") ? (
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                    />
                  ) : (
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedEmail.body}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedEmail(null)}
                className="px-6 py-2.5 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
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