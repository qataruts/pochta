defmodule VoxWeb.Auth do
  @moduledoc """
  Shared operator-token check. Uses a constant-time comparison so the admin token
  can't be recovered via a timing side channel.
  """
  import Plug.Conn, only: [get_req_header: 2]

  @doc "Is this request authorized with the admin bearer token?"
  def admin?(conn) do
    admin = Application.get_env(:vox, :admin_token)

    with true <- is_binary(admin) and admin != "",
         ["Bearer " <> tok] <- get_req_header(conn, "authorization") do
      Plug.Crypto.secure_compare(tok, admin)
    else
      _ -> false
    end
  end
end
