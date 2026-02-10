"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function ProfilePage() {
  const router = useRouter();

  // Display values
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Edit mode + form
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Messages
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const nameLS = localStorage.getItem("userFullName");
    const emailLS = localStorage.getItem("userEmail") || "";
    const passLS = localStorage.getItem("userPassword") || "";

    if (!nameLS) {
      router.push("/login");
      return;
    }

    setFullName(nameLS);
    setEmail(emailLS);
    setPassword(passLS);

    setEditName(nameLS);
    setEditPassword("");
    setConfirmPassword("");
  }, [router]);

  const handleSignOut = () => {
    localStorage.removeItem("userFullName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userPassword");
    router.push("/login");
  };

  const startEditing = () => {
    setError("");
    setSuccess("");
    setIsEditing(true);
    setEditName(fullName);
    setEditPassword("");
    setConfirmPassword("");
  };

  const cancelEditing = () => {
    setError("");
    setSuccess("");
    setIsEditing(false);
    setEditName(fullName);
    setEditPassword("");
    setConfirmPassword("");
  };

  const handleSave = () => {
    setError("");
    setSuccess("");

    const trimmedName = editName.trim();
    if (!trimmedName) {
      setError("Name cannot be empty.");
      return;
    }

    // If user typed a new password, validate it
    const wantsPasswordChange = editPassword.length > 0 || confirmPassword.length > 0;
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

    // Save name
    localStorage.setItem("userFullName", trimmedName);
    setFullName(trimmedName);

    // Save password only if changed
    if (wantsPasswordChange) {
      localStorage.setItem("userPassword", editPassword);
      setPassword(editPassword);
    }

    setIsEditing(false);
    setEditPassword("");
    setConfirmPassword("");
    setSuccess("Profile updated successfully.");
  };

  const maskedPassword = password ? "•".repeat(Math.min(password.length, 12)) : "Not set yet";
  const shownEmail = email || "Not set yet";

  return (
    <Box sx={{ minHeight: "100vh", p: 3 }}>
      <Box sx={{ maxWidth: 520, mx: "auto" }}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
          Profile
        </Typography>

        <Card elevation={1} sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              {success && <Alert severity="success">{success}</Alert>}

              <Box>
                <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                  Name
                </Typography>

                {!isEditing ? (
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
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

              <Divider />

              <Box>
                <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                  Email
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {shownEmail}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                  Password
                </Typography>

                {!isEditing ? (
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {maskedPassword}
                  </Typography>
                ) : (
                  <Stack spacing={1}>
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

              <Divider />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                {!isEditing ? (
                  <Button variant="contained" onClick={startEditing}>
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button variant="contained" onClick={handleSave}>
                      Save Changes
                    </Button>
                    <Button variant="outlined" onClick={cancelEditing}>
                      Cancel
                    </Button>
                  </>
                )}

                <Box sx={{ flex: 1 }} />

                <Button color="error" variant="contained" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </Stack>

              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
