defmodule Vox.RateLimiter do
  @moduledoc """
  Generic fixed-window (per-minute) rate limiter backed by a concurrent ETS
  counter, keyed by an arbitrary term. Used to cap abuse on the client channel
  (per socket) and inbound federation (per source IP and per peer key). Old
  windows are swept periodically.

  Fail policy: if the table is momentarily unavailable (the limiter GenServer is
  restarting), `allow?/2` fails OPEN so a rare limiter blip never drops live
  traffic — but it logs, so it isn't silent.
  """
  use GenServer
  require Logger

  @table :vox_rate
  @window_ms 60_000
  @sweep_ms 60_000

  def start_link(_opts), do: GenServer.start_link(__MODULE__, nil, name: __MODULE__)

  @doc "Record one hit for `key`; true if still at/under `max` this minute, else false."
  def allow?(key, max) do
    window = div(System.system_time(:millisecond), @window_ms)
    n = :ets.update_counter(@table, {key, window}, {2, 1}, {{key, window}, 0})
    n <= max
  rescue
    ArgumentError ->
      Logger.warning("Vox.RateLimiter table unavailable — allowing (fail-open)")
      true
  end

  @impl true
  def init(_) do
    :ets.new(@table, [:named_table, :public, :set, write_concurrency: true, read_concurrency: true])
    schedule_sweep()
    {:ok, %{}}
  end

  @impl true
  def handle_info(:sweep, state) do
    current = div(System.system_time(:millisecond), @window_ms)
    # Drop counters from windows older than the current one.
    :ets.select_delete(@table, [{{{:_, :"$1"}, :_}, [{:<, :"$1", current}], [true]}])
    schedule_sweep()
    {:noreply, state}
  end

  defp schedule_sweep, do: Process.send_after(self(), :sweep, @sweep_ms)
end
