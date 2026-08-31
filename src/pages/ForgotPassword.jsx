import React, { useState } from "react";
import { Link } from "react-router-dom";
import { appData } from "@/api/localClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, ArrowLeft, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

 export default function ForgotPassword() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetLink, setResetLink] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await appData.auth.resetPasswordRequest(username);
      if (result?.resetToken) {
        setResetLink(`${window.location.origin}/reset-password?token=${encodeURIComponent(result.resetToken)}`);
      }
    } catch {
      // Always show success regardless to avoid leaking account existence.
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthLayout
      icon={User}
      title="Reset password"
      subtitle="Create a local reset link for this browser"
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline">
          <ArrowLeft className="w-3 h-3 inline mr-1" />Back to log in
        </Link>
      }
    >
      {sent ? (
        <div className="space-y-3 text-sm text-center">
          <p className="text-foreground">
            This app runs locally, so no external email service is used. If the username matches an account, a browser-only reset link is ready below.
          </p>
          {resetLink ? (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-left break-all">
              <a href={resetLink} className="text-primary underline break-all">{resetLink}</a>
            </div>
          ) : (
            <p className="text-muted-foreground">If an account exists, you can request a new link from this screen.</p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="username"
                type="text"
                autoComplete="username"
                autoFocus
                placeholder="your_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
