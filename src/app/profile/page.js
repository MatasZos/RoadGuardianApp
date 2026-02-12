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
  const [motorbike, setMotorbike] = useState("");

  // Edit mode + form
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [editMotorbike, setEditMotorbike] = useState("");

  // Messages
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const nameLS = localStorage.getItem("userFullName");
    const emailLS = localStorage.getItem("userEmail") || "";
    const passLS = localStorage.getItem("userPassword") || "";
    const bikeLS = localStorage.getItem("userMotorbike") || "";

    if (!nameLS) {
      router.push("/login");
      return;
    }

    setFullName(nameLS);
    setEmail(emailLS);
    setPassword(passLS);
    setMotorbike(bikeLS);

    setEditName(nameLS);
    setEditPassword("");
    setConfirmPassword("");
    setEditMotorbike(bikeLS);
  }, [router]);

  const handleSignOut = () => {
    localStorage.removeItem("userFullName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userPassword");
    localStorage.removeItem("userMotorbike");
    router.push("/login");
  };

  const startEditing = () => {
    setError("");
    setSuccess("");
    setIsEditing(true);
    setEditName(fullName);
    setEditPassword("");
    setConfirmPassword("");
    setEditMotorbike(motorbike);
  };

  const cancelEditing = () => {
    setError("");
    setSuccess("");
    setIsEditing(false);
    setEditName(fullName);
    setEditPassword("");
    setConfirmPassword("");
    setEditMotorbike(motorbike);
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");

    const trimmedName = editName.trim();
    if (!trimmedName) {
      setError("Name cannot be empty.");
      return;
    }

    const trimmedBike = editMotorbike.trim();
    if (!trimmedBike) {
      setError("Motorbike cannot be empty.");
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

    // Update DB first
    const res = await fetch("/api/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        fullName: trimmedName,
        motorbike: trimmedBike,
        password: wantsPasswordChange ? editPassword : "",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data?.error || "Update failed");
      return;
    }

    // Update localStorage to match DB
    localStorage.setItem("userFullName", trimmedName);
    localStorage.setItem("userMotorbike", trimmedBike);

    setFullName(trimmedName);
    setMotorbike(trimmedBike);

    if (wantsPasswordChange) {
      localStorage.setItem("userPassword", editPassword);
      setPassword(editPassword);
    }

    setIsEditing(false);
    setEditPassword("");
    setConfirmPassword("");
    setSuccess("Profile updated successfully.");
  };

  const maskedPassword = password
    ? "•".repeat(Math.min(password.length, 12))
    : "Not set yet";

  const shownEmail = email || "Not set yet";
  const shownBike = motorbike || "Not set yet";

  return (
    <Box sx={{ minHeight: "100vh", p: 3 }}>
      <Navbar />

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

              <Divider />

              <Box>
                <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                  Motorbike
                </Typography>

                {!isEditing ? (
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {shownBike}
                  </Typography>
                ) : (
                  <TextField
                    fullWidth
                    size="small"
                    value={editMotorbike}
                    onChange={(e) => setEditMotorbike(e.target.value)}
                    placeholder="e.g. Yamaha R6"
                  />
                )}
              </Box>

              <Divider />

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

                <Button
                  color="error"
                  variant="contained"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
