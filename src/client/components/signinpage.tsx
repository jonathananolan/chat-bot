import { useState } from "react";
import { authClient } from "../lib/auth-client.js";
import React from "react";
import ReactDOM from "react-dom/client";

export function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = async () => {
    const { data, error } = await authClient.signIn.email({
      email,
      password,
    });
    if (error) alert(error.message ?? error.statusText ?? JSON.stringify(error));
    // no redirect needed — useSession() in App will re-render automatically
  };

  const handleSignUp = async () => {
    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name: email, // or add a name field
    });
    if (error) alert(error.message ?? error.statusText ?? JSON.stringify(error));
  };

  return (
    <div>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        placeholder="Password"
      />
      <button onClick={handleSignIn}>Sign in</button>
      <button onClick={handleSignUp}>Sign up</button>
    </div>
  );
}
