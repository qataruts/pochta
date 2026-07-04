defmodule Vox.HardeningTest do
  use ExUnit.Case, async: false

  describe "admin audit log" do
    setup do
      Vox.Repo.delete_all("admin_audit")
      :ok
    end

    test "records admin actions with attribution, newest first" do
      Vox.Audit.log("add_member", "pubX", "tok123abcd", "1.2.3.4")
      Vox.Audit.log("mint_token", "abcd1234…", "tok123abcd", "1.2.3.4")

      list = Vox.Audit.list()
      assert length(list) == 2
      assert hd(list).action == "mint_token"

      entry = Enum.find(list, &(&1.action == "add_member"))
      assert entry.detail == "pubX"
      assert entry.actor == "tok123abcd"
      assert entry.ip == "1.2.3.4"
      assert is_integer(entry.ts)
    end
  end

  describe "rate limiter" do
    test "caps a key after `max` hits per window; other keys unaffected" do
      key = {:t, System.unique_integer([:positive])}
      assert Vox.RateLimiter.allow?(key, 3)
      assert Vox.RateLimiter.allow?(key, 3)
      assert Vox.RateLimiter.allow?(key, 3)
      refute Vox.RateLimiter.allow?(key, 3)
      # a different key has its own budget
      assert Vox.RateLimiter.allow?({:t, System.unique_integer([:positive])}, 3)
    end
  end

  describe "enroll token expiry" do
    setup do
      prev = Application.get_env(:vox, :enroll_token_ttl_ms)
      on_exit(fn -> Application.put_env(:vox, :enroll_token_ttl_ms, prev) end)
      Vox.Repo.delete_all("enroll_tokens")
      :ok
    end

    test "a token older than the TTL can no longer be redeemed" do
      Application.put_env(:vox, :enroll_token_ttl_ms, 60_000)
      token = Vox.Membership.create_token()
      # backdate it beyond the TTL
      import Ecto.Query

      Vox.Repo.update_all(
        from(t in "enroll_tokens", where: t.token == ^token),
        set: [created_ts: System.system_time(:millisecond) - 120_000]
      )

      assert Vox.Membership.redeem(token, "pubExpired") == :error
    end

    test "a fresh token redeems once, then is spent" do
      Application.put_env(:vox, :enroll_token_ttl_ms, 60_000)
      token = Vox.Membership.create_token()
      assert Vox.Membership.redeem(token, "pubOk") == :ok
      assert Vox.Membership.redeem(token, "pubOk") == :error
    end
  end
end
