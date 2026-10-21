import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../schemas/auth.schema";
import { api } from "../api/client";
import { useAuthStore } from "../store/auth.store";

export default function Login() {
  const navigate = useNavigate();
  const setSession = useAuthStore(state => state.setSession);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm({  resolver: zodResolver(loginSchema) });

  const ROLE_HOME = {
    CUSTOMER: "/menu",
    WAITER: "/waiter",
    CHEF: "/kitchen",
    ADMIN: "/admin",
};

  const onSubmit = async (data) => {
    // Submit to server
    try {
      const res = await api.post("/auth/login", data);
      const { user, accessToken } = res.data;

      setSession({ user, accessToken });
      console.log(user, accessToken);
      
      navigate(
        user.mustChangePassword 
          ? "/change-password" 
          : ROLE_HOME[user.role]
      );

    } catch (err) {
      if (err.response) {
        setError("root.serverError", {
          message: err.response?.data?.error || "Login Failed."
        });
      } else {
        setError("root.serverError", {
          message: "Could not reach server. Try again"
        });
      }
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label htmlFor="email">Email: </label>
          <input
            type="email"
            id="email"
            placeholder="jane@company.com"
            autoComplete="email"
            required
            {...register("email")}
          />
          {errors.email && <p className="error-message" role="alert">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password">Password: </label>
          <input
            type="password"
            id="password"
            placeholder="*******"
            autoComplete="current-password"
            required
            {...register("password")}
          />
          {errors.password && <p className="error-message" role="alert">{errors.password.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in" : "Login"}
        </button>
        {errors.root?.serverError && <p className="error-message" role="alert">{errors.root.serverError.message}</p>}
      </form>
    </div>
  );
}