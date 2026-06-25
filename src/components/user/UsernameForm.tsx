"use client";

import React, { useState, FormEvent } from "react";
import { useUserPresence } from "./UserPresenceProvider";

type Props = {
  onSubmitSuccess?: () => void;
};

export default function UsernameForm({ onSubmitSuccess }: Props) {
  const { login } = useUserPresence();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }
    if (trimmed.length > 24) {
      setError("Name must be 24 characters or less");
      return;
    }
    setError("");
    login(trimmed);
    if (onSubmitSuccess) {
      onSubmitSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="username-form">
      <div className="form-title">Personalize Experience</div>
      <div className="form-description">Enter your name to access your CodeAtlas profile.</div>
      <div className="form-group">
        <input
          type="text"
          className="username-input"
          placeholder="Display Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError("");
          }}
          autoFocus
          maxLength={24}
        />
        {error && <div className="form-error-msg">{error}</div>}
      </div>
      <button type="submit" className="form-submit-btn">
        Save Profile
      </button>
    </form>
  );
}
