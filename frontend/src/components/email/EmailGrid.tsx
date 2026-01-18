"use client";

import { EmailRecord } from "@/types";
import { EmailCard } from "./EmailCard";

interface EmailGridProps {
  emails: EmailRecord[];
}

export const EmailGrid: React.FC<EmailGridProps> = ({ emails }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {emails.map((email) => (
        <EmailCard key={email.id} email={email} />
      ))}
    </div>
  );
};