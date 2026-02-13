import { authClient } from "@/client/lib/auth-client"; //import the auth client

const { data, error } = await authClient.signUp.email(
  {
    email: "user@example.com", // user email address
    password: "secure password", // user password -> min 8 characters by default
    name: "Jonathan", // user display name
    callbackURL: "/dashboard", // A URL to redirect to after the user verifies their email (optional)
  },
  {
    onRequest: (ctx) => {
      //show loading
    },
    onSuccess: (ctx) => {
      //redirect to the dashboard or sign in page
    },
    onError: (ctx) => {
      // display the error message
      alert(ctx.error.message);
    },
  },
);
