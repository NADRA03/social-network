"use client";

import { create } from "zustand";

type GroupMember = {
  ID: number;
  Username: string;
};

type GroupDetails = {
  id: number;
  name: string;
  description: string;
  members: GroupMember[];
};

type Store = {
  selectedGroupId: number | null;
  selectedUserId: number | null;
  selectedGroupDetails: GroupDetails | null;
  setSelectedGroupId: (id: number | null) => void;
  setSelectedUserId: (id: number | null) => void;
  setSelectedGroupDetails: (details: GroupDetails | null) => void;
};

export const useGroupStore = create<Store>((set) => ({
  selectedGroupId: null,
  selectedUserId: null,
  selectedGroupDetails: null,
  setSelectedGroupId: (id) => set({ selectedGroupId: id }),
  setSelectedUserId: (id) => set({ selectedUserId: id }),
  setSelectedGroupDetails: (details) => set({ selectedGroupDetails: details }),
}));

export const getSelectedGroupId = () => useGroupStore.getState().selectedGroupId;
export const getSelectedUserId = () => useGroupStore.getState().selectedUserId;
export const getSelectedGroupDetails = () => useGroupStore.getState().selectedGroupDetails;

// {
//     "group_id": 1,
//     "name": "malak",
//     "description": "desc",
//     "creator_id": 2,
//     "created_at": "2025-06-30T01:03:16Z",
//     "members": [
//         {
//             "ID": 1,
//             "Username": "James",
//             "Email": "james@example.com",
//             "FirstName": "",
//             "LastName": "",
//             "Age": 0,
//             "Gender": "",
//             "CreatedAt": "2025-06-27T23:11:16Z",
//             "ImageURL": "",
//             "LastMessageTime": {
//                 "String": "",
//                 "Valid": false
//             },
//             "LastMessageText": {
//                 "String": "",
//                 "Valid": false
//             },
//             "LastMessageFrom": {
//                 "Int64": 0,
//                 "Valid": false
//             },
//             "LastMessageOwner": "",
//             "Bio": "",
//             "AvatarURL": "",
//             "IsPrivate": false
//         },
//         {
//             "ID": 2,
//             "Username": "malak",
//             "Email": "malakhabeeb2003@gmail.com",
//             "FirstName": "",
//             "LastName": "",
//             "Age": 0,
//             "Gender": "",
//             "CreatedAt": "2025-06-27T23:12:57Z",
//             "ImageURL": "",
//             "LastMessageTime": {
//                 "String": "",
//                 "Valid": false
//             },
//             "LastMessageText": {
//                 "String": "",
//                 "Valid": false
//             },
//             "LastMessageFrom": {
//                 "Int64": 0,
//                 "Valid": false
//             },
//             "LastMessageOwner": "",
//             "Bio": "",
//             "AvatarURL": "",
//             "IsPrivate": false
//         }
//     ]
// }