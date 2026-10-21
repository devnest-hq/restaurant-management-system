import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from  "@hookform/resolvers/zod";
import { registerSchema } from "../schemas/auth.schema";
import { api } from "../api/client";

export default function Register() {
  const navigate = useNavigate();

  const { 
    register, 
    handleSubmit,
    setError,
    formState: { errors, isSubmitting } 
  } = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data) => {
    const userData = {
      name: data.name,
      email: data.email,
      password: data.password,
    }

    try {
      // Submit to server
      const res = await api.post("/auth/register", userData);
      navigate("/login");
      console.log(res.data);

    } catch (err) {
      if (err.response) {
        setError("root.serverError", {
          message: err.response?.data?.error || "Registration Failed. Try again"
        });
        console.log(err.response);
      } else {
        setError("root.serverError", {
          message: "Could not reach server. Try again."
        });
      }
    } 
  }

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label htmlFor="name">Full Name: </label>
          <input 
            type="text"
            id="name"
            placeholder="John Doe"
            required
            {...register("name")}
          />
          {errors.name && <p className="error-message" role="alert">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="email">Email: </label>
          <input 
            type="email" 
            id="email"
            autoComplete="email"
            placeholder="jane@company.com"
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
            autoComplete="new-password"
            placeholder="******"
            required
            {...register("password")}
          />
          {errors.password && <p className="error-message" role="alert">{errors.password.message}</p>}
        </div>

        <div>
          <label htmlFor="confirm-password">Confirm Password: </label>
          <input
            type="password"
            id="confirm-password"
            autoComplete="new-password"
            placeholder="******"
            required
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && <p className="error-message" role="alert">{errors.confirmPassword.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create account..."}
        </button>
        {errors.root?.serverError && <p className="error-message" role="alert">{errors.root.serverError.message}</p>}
      </form>
    </div>
  );
}