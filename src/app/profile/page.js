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

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [motorbike, setMotorbike] = useState("");
  const [phone, setPhone] = useState(""); 

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [editMotorbike, setEditMotorbike] = useState("");
  const [editPhone, setEditPhone] = useState(""); 

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const nameLS = localStorage.getItem("userFullName");
    const emailLS = localStorage.getItem("userEmail") || "";
    const phoneLS = localStorage.getItem("userPhone") || ""; 

    if (!nameLS || !emailLS) {
      router.push("/login");
      return;
    }

    setFullName(nameLS);
    setEmail(emailLS);

    setPhone(phoneLS); 

    setEditName(nameLS);
    setEditPassword("");
    setConfirmPassword("");
    setEditPhone(phoneLS); 

    (async () => {
      try {
        const res = await fetch("/api/profile", {
          headers: {
            "x-user-email": emailLS,
          },
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data?.error || "Failed to load profile");
          return;
        }

        setFullName(data.fullName || "");
        setPassword(data.password || "");
        setMotorbike(data.motorbike || "");
        setPhone(data.phone || ""); 

        localStorage.setItem("userFullName", data.fullName || "");
        localStorage.setItem("userPassword", data.password || "");
        localStorage.setItem("userMotorbike", data.motorbike || "");
        localStorage.setItem("userPhone", data.phone || ""); 

        setEditName(data.fullName || "");
        setEditMotorbike(data.motorbike || "");
        setEditPhone(data.phone || ""); 
      } catch (err) {
        setError("Server error loading profile");
      }
    })();
  }, [router]);

  const handleSignOut = () => {
    localStorage.removeItem("userFullName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userPassword");
    localStorage.removeItem("userMotorbike");
    localStorage.removeItem("userPhone"); 
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
    setEditPhone(phone); 
  };

  const cancelEditing = () => {
    setError("");
    setSuccess("");
    setIsEditing(false);
    setEditName(fullName);
    setEditPassword("");
    setConfirmPassword("");
    setEditMotorbike(motorbike);
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

    const trimmedBike = editMotorbike.trim();
    if (!trimmedBike) {
      setError("Motorbike cannot be empty.");
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
        motorbike: trimmedBike,
        phone: trimmedPhone, 
        password: wantsPasswordChange ? editPassword : "",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data?.error || "Update failed");
      return;
    }

    localStorage.setItem("userFullName", trimmedName);
    localStorage.setItem("userMotorbike", trimmedBike);
    localStorage.setItem("userPhone", trimmedPhone); 

    setFullName(trimmedName);
    setMotorbike(trimmedBike);
    setPhone(trimmedPhone); 

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
    : "";

  const shownEmail = email || "Not set yet";
  const shownBike = motorbike || "Not set yet";
  const shownPhone = phone || "Not set yet"; 

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
                  Phone
                </Typography>

                {!isEditing ? (
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {shownPhone}
                  </Typography>
                ) : (
                  <TextField
                    fullWidth
                    size="small"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="e.g. +353 87 123 4567"
                  />
                )}
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
