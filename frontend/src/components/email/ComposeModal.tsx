"use client";

import { useState } from "react";
import { X, Upload, Clock, Mail, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { emailApi } from "@/lib/api";
import toast from "react-hot-toast";
import Papa from "papaparse";
import { useSession } from "next-auth/react";

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [recipientMode, setRecipientMode] = useState<"manual" | "csv">("manual");
  const [manualRecipients, setManualRecipients] = useState<string[]>([""]);
  const [csvRecipients, setCsvRecipients] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    subject: "",
    body: "",
    scheduledAt: "",
    delayBetweenEmails: 2000,
    hourlyLimit: 50,
  });

  if (!isOpen) return null;

  const handleAddRecipient = () => {
    setManualRecipients([...manualRecipients, ""]);
  };

  const handleRemoveRecipient = (index: number) => {
    const newRecipients = manualRecipients.filter((_, i) => i !== index);
    setManualRecipients(newRecipients.length > 0 ? newRecipients : [""]);
  };

  const handleRecipientChange = (index: number, value: string) => {
    const newRecipients = [...manualRecipients];
    newRecipients[index] = value;
    setManualRecipients(newRecipients);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const emails: string[] = [];
        results.data.forEach((row: any) => {
          if (Array.isArray(row)) {
            row.forEach((cell) => {
              if (typeof cell === "string" && cell.includes("@")) {
                emails.push(cell.trim());
              }
            });
          } else if (typeof row === "object") {
            Object.values(row).forEach((value) => {
              if (typeof value === "string" && value.includes("@")) {
                emails.push(value.trim());
              }
            });
          }
        });
        const uniqueEmails = [...new Set(emails)];
        setCsvRecipients(uniqueEmails);
        toast.success(`${uniqueEmails.length} email addresses detected`);
      },
      error: (error) => {
        toast.error("Failed to parse CSV file");
        console.error(error);
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.email) {
      toast.error("Please login to schedule emails");
      return;
    }

    // Get recipients based on mode
    const recipients = recipientMode === "manual" 
      ? manualRecipients.filter(email => email.trim() !== "")
      : csvRecipients;

    if (recipients.length === 0) {
      toast.error("Please add at least one recipient");
      return;
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipients.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      toast.error(`Invalid email addresses: ${invalidEmails.join(", ")}`);
      return;
    }

    if (!formData.scheduledAt) {
      toast.error("Please select a start time");
      return;
    }

    setIsLoading(true);

    try {
      if (recipients.length === 1) {
        // Single email
        await emailApi.scheduleEmail({
          senderEmail: session.user.email,
          recipientEmail: recipients[0],
          subject: formData.subject,
          body: formData.body,
          scheduledAt: new Date(formData.scheduledAt).toISOString(),
        });
        toast.success("Email scheduled successfully!");
      } else {
        // Bulk emails
        await emailApi.scheduleBulkEmails({
          senderEmail: session.user.email,
          recipients,
          subject: formData.subject,
          body: formData.body,
          scheduledAt: new Date(formData.scheduledAt).toISOString(),
          delayBetweenEmails: formData.delayBetweenEmails,
          hourlyLimit: formData.hourlyLimit,
        });
        toast.success(`Successfully scheduled ${recipients.length} emails!`);
      }

      onSuccess();
      onClose();
      
      // Reset form
      setManualRecipients([""]);
      setCsvRecipients([]);
      setRecipientMode("manual");
      setFormData({
        subject: "",
        body: "",
        scheduledAt: "",
        delayBetweenEmails: 2000,
        hourlyLimit: 50,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to schedule emails");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalRecipients = recipientMode === "manual"
    ? manualRecipients.filter(email => email.trim() !== "").length
    : csvRecipients.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Compose New Email
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From
              </label>
              <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                {session?.user?.email || "your-email@example.com"}
              </div>
            </div>

            {/* Recipients Mode Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipients
              </label>
              <div className="flex items-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setRecipientMode("manual")}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    recipientMode === "manual"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Manual Entry
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientMode("csv")}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    recipientMode === "csv"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Upload CSV
                </button>
              </div>

              {recipientMode === "manual" ? (
                <div className="space-y-3">
                  {manualRecipients.map((email, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="email"
                        placeholder="recipient@example.com"
                        value={email}
                        onChange={(e) => handleRecipientChange(index, e.target.value)}
                        className="flex-1"
                      />
                      {manualRecipients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipient(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddRecipient}
                    className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add another recipient
                  </button>
                </div>
              ) : (
                <div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="w-10 h-10 text-gray-400 mb-2" />
                      <p className="text-sm font-medium text-gray-700">
                        Upload CSV or TXT file
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Click to browse or drag and drop
                      </p>
                    </label>
                  </div>
                  {csvRecipients.length > 0 && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <Mail className="w-4 h-4" />
                        <span className="font-medium">
                          {csvRecipients.length} email addresses detected
                        </span>
                      </div>
                      <div className="mt-2 max-h-32 overflow-y-auto">
                        <div className="flex flex-wrap gap-2">
                          {csvRecipients.slice(0, 10).map((email, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-white px-2 py-1 rounded border border-green-200"
                            >
                              {email}
                            </span>
                          ))}
                          {csvRecipients.length > 10 && (
                            <span className="text-xs text-green-600 px-2 py-1">
                              +{csvRecipients.length - 10} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {totalRecipients > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  Total recipients: <span className="font-semibold">{totalRecipients}</span>
                </p>
              )}
            </div>

            {/* Subject */}
            <Input
              label="Subject"
              placeholder="Enter email subject"
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              required
            />

            {/* Body */}
            <Textarea
              label="Body"
              placeholder="Type your message here..."
              rows={6}
              value={formData.body}
              onChange={(e) =>
                setFormData({ ...formData, body: e.target.value })
              }
              required
            />

            {/* Scheduling Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledAt: e.target.value })
                  }
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              {totalRecipients > 1 && (
                <>
                  <Input
                    label="Delay Between Emails (ms)"
                    type="number"
                    placeholder="2000"
                    min="1000"
                    value={formData.delayBetweenEmails}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        delayBetweenEmails: parseInt(e.target.value),
                      })
                    }
                  />

                  <Input
                    label="Hourly Limit"
                    type="number"
                    placeholder="50"
                    min="1"
                    value={formData.hourlyLimit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hourlyLimit: parseInt(e.target.value),
                      })
                    }
                  />
                </>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            {totalRecipients > 0 && (
              <span>
                Ready to schedule <span className="font-semibold">{totalRecipients}</span>{" "}
                {totalRecipients === 1 ? "email" : "emails"}
              </span>
            )}
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={totalRecipients === 0}
            >
              Schedule {totalRecipients > 1 && `${totalRecipients} `}Email{totalRecipients !== 1 && "s"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};