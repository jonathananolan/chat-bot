const { data, error } = await authClient.signIn.email(
  {
    /**
     * The user email
     */
    email: "user@example.com",
    password: "securepassword",
    /**
     * A URL to redirect to after the user verifies their email (optional)
     */
    callbackURL: "/",
    /**
     * remember the user session after the browser is closed.
     * @default true
     */
    rememberMe: false,
  },
  {
    //callbacks
  },
);
