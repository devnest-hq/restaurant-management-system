import { useNavigate } from "react-router";
import { useForm } from "react-hook-form"
import { api } from "../api/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema } from "../schemas/auth.schema";
import { useAuthStore } from "../store/auth.store";
import { ROLE_HOME } from "../constants/roles";

export default function ChangePassword() {
  const navaigate = useNavigate();
  const user = useAuthStore(state => state.user);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = async (data) => {
    // Submite to server
    try {
      await api.post("/auth/change-password", data);
      useAuthStore.getState().updateUser({ mustChangePassword: false });
      navaigate(ROLE_HOME[user.role], { replace: true });
    
    } catch(err) {
      if (err.response) {
        setError("root.serverError", {
          message: err.response?.data?.error || "Password change failed"
        });
      } else {
        setError("root.serverError", {
          message: "Could not reach server. Try again"
        });
      }
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label htmlFor="Old-password"></label>
          <input
            type="password"
            id="old-password"
            placeholder="Old password"
            required
            autoComplete="current-password"
            {...register("oldPassword")}
          />
          {errors.oldPassword && <p className="error-message">{errors.oldPassword.message}</p>}
        </div>

        <div>
          <label htmlFor="new-password"></label>
          <input
            type="password"
            id="new-password"
            required
            placeholder="New password"
            autoComplete="new-password"
            {...register("newPassword")}
          />
          {errors.newPassword && <p className="error-message">{errors.newPassword.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting}>Change password</button>
      </form>
    </>
  )
}