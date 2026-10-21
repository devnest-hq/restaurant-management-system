export default function ChangePassword() {
  return (
    <>
      <form>
        <div>
          <input
            type="password"
            placeholder="Old password"
            required
          />
        </div>

        <div>
          <input
            type="password"
            required
            placeholder="New password" />
        </div>

        <button type="submit">Change password</button>
      </form>
    </>
  )
}