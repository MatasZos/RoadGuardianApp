"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Navbar from "../components/Navbar";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Divider,
  Alert,
} from "@mui/material";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    const sessionName = session?.user?.name || "";
    const sessionEmail = session?.user?.email || "";

    setFullName(sessionName);
    setEmail(sessionEmail);
    setEditName(sessionName);
  }, [status, session, router]);

  useEffect(() => {
    if (!email) return;

    (async () => {
      try {
        const res = await fetch("/api/profile", {
          headers: {
            "x-user-email": email,
          },
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data?.error || "Failed to load profile");
          return;
        }

        setFullName(data.fullName || session?.user?.name || "");
        setPhone(data.phone || "");

        setEditName(data.fullName || session?.user?.name || "");
        setEditPhone(data.phone || "");
      } catch {
        setError("Server error loading profile");
      }
    })();
  }, [email, session]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const startEditing = () => {
    setError("");
    setSuccess("");
    setIsEditing(true);
    setEditName(fullName);
    setEditPassword("");
    setConfirmPassword("");
    setEditPhone(phone);
  };

  const cancelEditing = () => {
    setError("");
    setSuccess("");
    setIsEditing(false);
    setEditName(fullName);
    setEditPassword("");
    setConfirmPassword("");
    setEditPhone(phone);
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");

    const trimmedName = editName.trim();
    if (!trimmedName) {
      setError("Name cannot be empty.");
      return;
    }

    const trimmedPhone = editPhone.trim();
    if (!trimmedPhone) {
      setError("Phone number cannot be empty.");
      return;
    }

    const wantsPasswordChange =
      editPassword.length > 0 || confirmPassword.length > 0;

    if (wantsPasswordChange) {
      if (editPassword.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (editPassword !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    const res = await fetch("/api/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        fullName: trimmedName,
        phone: trimmedPhone,
        password: wantsPasswordChange ? editPassword : "",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data?.error || "Update failed");
      return;
    }

    setFullName(trimmedName);
    setPhone(trimmedPhone);

    setIsEditing(false);
    setEditPassword("");
    setConfirmPassword("");
    setSuccess("Profile updated successfully.");
  };

  const maskedPassword = "••••••••••••";
  const shownEmail = email || "Not set yet";
  const shownPhone = phone || "Not set yet";

  if (status === "loading") {
    return (
      <Box className={styles.loadingWrap}>
        <Typography className={styles.loadingText}>Loading...</Typography>
      </Box>
    );
  }

  return (
    <div className={styles.page}>
      <Navbar />

      <div className={styles.container}>
        <div className={styles.hero}>
          <h1 className={styles.pageTitle}>Profile</h1>
          <p className={styles.pageSubtitle}>
            Manage your personal details and account information.
          </p>
        </div>

        <Card className={styles.card} elevation={0}>
          <CardContent className={styles.cardContent}>
            <Stack spacing={2.2}>
              {error && <Alert severity="error">{error}</Alert>}
              {success && <Alert severity="success">{success}</Alert>}

              <Box className={styles.fieldBlock}>
                <Typography variant="subtitle2" className={styles.fieldLabel}>
                  Name
                </Typography>

                {!isEditing ? (
                  <Typography variant="body1" className={styles.fieldValue}>
                    {fullName}
                  </Typography>
                ) : (
                  <TextField
                    fullWidth
                    size="small"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your name"
                  />
                )}
              </Box>

              <Divider className={styles.divider} />

              <Box className={styles.fieldBlock}>
                <Typography variant="subtitle2" className={styles.fieldLabel}>
                  Email
                </Typography>
                <Typography variant="body1" className={styles.fieldValue}>
                  {shownEmail}
                </Typography>
              </Box>

              <Divider className={styles.divider} />

              <Box className={styles.fieldBlock}>
                <Typography variant="subtitle2" className={styles.fieldLabel}>
                  Phone
                </Typography>

                {!isEditing ? (
                  <Typography variant="body1" className={styles.fieldValue}>
                    {shownPhone}
                  </Typography>
                ) : (
                  <TextField
                    fullWidth
                    size="small"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="e.g. 08XXXXXXXX"
                  />
                )}
              </Box>

              <Divider className={styles.divider} />

              <Box className={styles.fieldBlock}>
                <Typography variant="subtitle2" className={styles.fieldLabel}>
                  Password
                </Typography>

                {!isEditing ? (
                  <Typography variant="body1" className={styles.fieldValue}>
                    {maskedPassword}
                  </Typography>
                ) : (
                  <Stack spacing={1.2}>
                    <TextField
                      fullWidth
                      size="small"
                      type="password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="New password"
                      helperText="Leave blank to keep your current password"
                    />
                    <TextField
                      fullWidth
                      size="small"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </Stack>
                )}
              </Box>

              <Divider className={styles.divider} />

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.2}
                className={styles.actions}
              >
                {!isEditing ? (
                  <Button
                    variant="contained"
                    onClick={startEditing}
                    className={styles.primaryButton}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      onClick={handleSave}
                      className={styles.primaryButton}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={cancelEditing}
                      className={styles.secondaryButton}
                    >
                      Cancel
                    </Button>
                  </>
                )}

                <Box sx={{ flex: 1 }} />

                <Button
                  color="error"
                  variant="contained"
                  onClick={handleSignOut}
                  className={styles.signOutButton}
                >
                  Sign Out
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
