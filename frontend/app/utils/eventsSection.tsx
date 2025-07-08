"use client";

import React, { useEffect, useState } from "react";
import { useGroupStore } from "./store";
import { votePoll, createGroupEvent, getGroupEvents } from "../api";

type Poll = {
  id: number;
  event_id: number;
  option_text: string;
  votes?: number;
};

type GroupEvent = {
  id: number;
  name: string;
  description: string;
  time: string;
  location: string;
  created_at: string;
  host_id: number;
  polls: Poll[];
  voted_option_id?: number | null;
};

export default function EventsSection() {
  const { selectedGroupDetails, selectedGroupId } = useGroupStore();
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    time: "",
    location: "",
  });
  const [pollOptions, setPollOptions] = useState<string[]>([""]);

  useEffect(() => {
    if (!selectedGroupId) return;
    loadEvents();
  }, [selectedGroupId]);

  const loadEvents = async () => {
    try {
      const data = await getGroupEvents(selectedGroupId!);
      setEvents(data);
    } catch (err) {
      console.error("Failed to load events", err);
    }
  };

  const handleVote = async (eventId: number, optionId: number) => {
      const event = events.find(e => e.id === eventId);
      if (!event || event.voted_option_id) return; 

    try {
      await votePoll(optionId);
      await loadEvents(); 
    } catch (err) {
      console.error("Failed to vote:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId) return;

    try {
      const payload = {
        ...formData,
        group_id: selectedGroupId,
        polls: pollOptions.filter(opt => opt.trim() !== '').map(opt => ({ option_text: opt.trim() }))
      };

      const newEvent = await createGroupEvent(payload);
      console.log(newEvent);
      setEvents((prev) => [...prev, newEvent]);
      setFormData({ name: "", description: "", time: "", location: "" });
      setPollOptions([""]);
    } catch (err) {
      console.error("Failed to create event", err);
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const addPollOption = () => setPollOptions([...pollOptions, ""]);
  const removePollOption = (index: number) => {
    const newOptions = pollOptions.filter((_, i) => i !== index);
    setPollOptions(newOptions);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
         {!Array.isArray(events) || events.length === 0 ? (
          <p className="text-gray-400">No events yet</p>
        ) : (
          events.map((event) => {
            const host = selectedGroupDetails?.members.find(m => m.ID === event.host_id);
            const createdDate = new Date(event.created_at).toLocaleDateString();
            const hasVoted = !!event.voted_option_id;

            return (
              <div key={event.id} className="space-y-1">
                <div className="flex items-start gap-4">
                  <div className="relative inline-flex items-center justify-center w-10 h-10 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600 mt-5">
                    <span className="font-medium text-gray-600 dark:text-gray-300">
                      {host?.Username?.[0]?.toUpperCase() || "?"}
                    </span>
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 ml-1">
                      {host?.Username || "Unknown"} <span className="text-xs text-gray-400 ml-1">{createdDate}</span>
                    </p>

                    <div className="relative p-5 bg-base-100 dark:bg-base-300 rounded-lg shadow-md border border-base-200 space-y-2 overflow-hidden">
                      <h4 className="text-sm">{event.name}</h4>
                      <p className="text-sm text-gray-500">🕒 {new Date(event.time).toLocaleString()}</p>
                      <p className="text-sm">{event.description}</p>
                      <p className="text-sm text-gray-600">📍 {event.location}</p>

                      {event.polls?.length > 0 && (
                        <div className="mt-3">
                          <p className="font-medium text-sm mb-1">🗳️ :</p>

                          <div className="space-y-2">
                            {event.polls.map((poll) => {
                              const totalVotes = event.polls.reduce((sum, p) => sum + (p.votes ?? 0), 0) || 1;
                              const isSelected = poll.id === event.voted_option_id;
                              const percentage = ((poll.votes ?? 0) / totalVotes) * 100;

                              return (
                                <div
                                  key={poll.id}
                                  className={`relative rounded overflow-hidden border border-base-300 cursor-pointer transition-all ${
                                    isSelected ? "ring-2 ring-blue-500" : "hover:bg-base-200"
                                  } ${hasVoted ? "pointer-events-none" : ""}`}
                                  onClick={() => !hasVoted && handleVote(event.id, poll.id)}
                                >
                                  <div
                                    className="absolute left-0 top-0 h-full bg-blue-500 opacity-30 transition-all duration-300"
                                    style={{ width: `${percentage}%` }}
                                  />
                                  <div className="relative px-4 py-2 flex justify-between items-center text-sm z-10">
                                    <span className="font-medium">{poll.option_text}</span>
                                    <span className="text-xs text-gray-600 dark:text-gray-300">
                                      {isSelected ? "✓ Your vote" : `${poll.votes ?? 0} vote${poll.votes !== 1 ? "s" : ""}`}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>


      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-base-300 flex flex-wrap gap-2 items-center bg-base-200"
        style={{ position: "sticky", bottom: 0, background: "var(--b2)", zIndex: 10 }}
      >
        <input type="text" placeholder="Event name" className="input input-bordered flex-1 min-w-[150px]" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
        <input type="text" placeholder="Location" className="input input-bordered flex-1 min-w-[150px]" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
        <input type="datetime-local" className="input input-bordered flex-1 min-w-[180px]" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} required />
        <input type="text" placeholder="Short description" className="input input-bordered flex-1 min-w-[200px]" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />

        {pollOptions.map((option, index) => (
          <div key={index} className="flex gap-1 items-center">
            <input
              type="text"
              placeholder={`Poll option ${index + 1}`}
              className="input input-bordered"
              value={option}
              onChange={(e) => updatePollOption(index, e.target.value)}
            />
            <button type="button" onClick={() => removePollOption(index)} className="btn btn-sm btn-error">
              ✕
            </button>
          </div>
        ))}

        <button type="button" onClick={addPollOption} className="btn btn-sm">+ Option</button>

        <div className="w-full flex justify-center mt-3">
          <button
            type="submit"
            className="relative px-6 py-2 text-white font-medium group overflow-hidden rounded-md"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 rounded-md blur-sm opacity-70 group-hover:opacity-100 transition duration-200"></span>
            <span className="relative z-10">Submit</span>
          </button>
        </div>
      </form>
    </div>
  );
}
