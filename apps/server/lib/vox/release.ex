defmodule Vox.Release do
  @moduledoc "Runs pending migrations (called at boot after the Repo starts)."

  @migrations [
    {1, Vox.Migrations.Init},
    {2, Vox.Migrations.AddBlobs},
    {3, Vox.Migrations.AddFederationOutbox},
    {4, Vox.Migrations.AddKnownRelays},
    {5, Vox.Migrations.AddMembership},
    {6, Vox.Migrations.AddAdminAudit}
  ]

  def migrate do
    Ecto.Migrator.run(Vox.Repo, @migrations, :up, all: true)
    :ok
  end

  @doc "Start just the Repo (+ deps) for CLI tasks — no endpoint, safe alongside a running server."
  def boot_repo do
    Logger.configure(level: :warning)
    Application.put_env(:vox, Vox.Repo, [{:log, false} | Application.get_env(:vox, Vox.Repo, [])])
    Application.ensure_all_started(:ecto_sqlite3)
    Application.ensure_all_started(:postgrex)
    Application.ensure_all_started(:req)

    case Vox.Repo.start_link() do
      {:ok, _} -> :ok
      {:error, {:already_started, _}} -> :ok
    end
  end
end

