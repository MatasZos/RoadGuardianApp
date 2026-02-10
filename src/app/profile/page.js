"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
  }, [router]);

  const handleSignOut = () => {
    localStorage.removeItem("userFullName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userPassword");
    router.push("/login");
  };

  const handleSave = () => {
    setError("");
    setSuccess("");

    if (!editName.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    if (editPassword || confirmPassword) {
      if (editPassword.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (editPassword !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      localStorage.setItem("userPassword", editPassword);
      setPassword(editPassword);
    }

    localStorage.setItem("userFullName", editName.trim());
    setFullName(editName.trim());

    setIsEditing(false);
    setEditPassword("");
    setConfirmPassword("");
    setSuccess("Profile updated.");
  };

  const maskedPassword = password
    ? "•".repeat(Math.min(password.length, 12))
    : "Not set";

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Profile
      </Typography>

      <Card
        sx={{
          borderRadius: 3,
          boxShadow: 3,
        }}
      >
        <CardContent>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}

            <Box>
              <Typography variant="subtitle2">Name</Typography>
              {!isEditing ? (
                <Typography>{fullName}</Typography>
              ) : (
                <TextField
                  fullWidth
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              )}
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2">Email</Typography>
              <Typography>{email || "Not set"}</Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2">Password</Typography>
              {!isEditing ? (
                <Typography>{maskedPassword}</Typography>
              ) : (
                <Stack spacing={1}>
                  <TextField
                    fullWidth
                    type="password"
                    placeholder="New password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                  />
                  <TextField
                    fullWidth
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </Stack>
              )}
            </Box>

            <Divider />

            <Stack direction="row" spacing={1}>
              {!isEditing ? (
                <Button variant="contained" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button variant="contained" onClick={handleSave}>
                    Save
                  </Button>
                  <Button variant="outlined" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </>
              )}

              <Box sx={{ flexGrow: 1 }} />

              <Button color="error" onClick={handleSignOut}>
                Sign Out
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
