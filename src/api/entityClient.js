import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
} from "firebase/firestore";

import { db } from "./firebase";

// ==========================
// STUDENT
// ==========================

export const Student = {

  async list() {
    const snapshot = await getDocs(collection(db, "students"));

    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
  },

  async create(data) {
    const ref = await addDoc(collection(db, "students"), data);

    return {
      id: ref.id,
      ...data
    };
  },

  async update(id, data) {
    await updateDoc(doc(db, "students", id), data);

    return true;
  },

  async delete(id) {
    await deleteDoc(doc(db, "students", id));

    return true;
  },

  async filter(filters = {}) {

    let q = collection(db, "students");

    const conditions = [];

    Object.keys(filters).forEach(key => {
      conditions.push(where(key, "==", filters[key]));
    });

    if (conditions.length > 0) {
      q = query(q, ...conditions);
    }

    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
  }

};// ==========================
// ATTENDANCE
// ==========================

export const Attendance = {

  async list() {
    const snapshot = await getDocs(collection(db, "attendance"));

    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
  },

  async create(data) {
    const ref = await addDoc(collection(db, "attendance"), data);

    return {
      id: ref.id,
      ...data
    };
  },

  async update(id, data) {
    await updateDoc(doc(db, "attendance", id), data);

    return true;
  },

  async delete(id) {
    await deleteDoc(doc(db, "attendance", id));

    return true;
  },

  async filter(filters = {}) {

    let q = collection(db, "attendance");

    const conditions = [];

    Object.keys(filters).forEach(key => {
      conditions.push(where(key, "==", filters[key]));
    });

    if (conditions.length > 0) {
      q = query(q, ...conditions);
    }

    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
  }

};// ==========================
// LEAVE
// ==========================

export const Leave = {

  async list() {
    const snapshot = await getDocs(collection(db, "leave"));

    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
  },

  async create(data) {
    const ref = await addDoc(collection(db, "leave"), data);

    return {
      id: ref.id,
      ...data
    };
  },

  async update(id, data) {
    await updateDoc(doc(db, "leave", id), data);
    return true;
  },

  async delete(id) {
    await deleteDoc(doc(db, "leave", id));
    return true;
  },

  async filter(filters = {}) {
    let q = collection(db, "leave");

    const conditions = [];

    Object.keys(filters).forEach(key => {
      conditions.push(where(key, "==", filters[key]));
    });

    if (conditions.length > 0) {
      q = query(q, ...conditions);
    }

    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
  }

};

// ==========================
// WARNING
// ==========================

export const Warning = {

  async list() {
    const snapshot = await getDocs(collection(db, "warnings"));

    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
  },

  async create(data) {
    const ref = await addDoc(collection(db, "warnings"), data);

    return {
      id: ref.id,
      ...data
    };
  },

  async update(id, data) {
    await updateDoc(doc(db, "warnings", id), data);
    return true;
  },

  async delete(id) {
    await deleteDoc(doc(db, "warnings", id));
    return true;
  }

};

// ==========================
// WORKING DAY
// ==========================

export const WorkingDay = {

  async list() {
    const snapshot = await getDocs(collection(db, "workingDays"));

    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
  },

  async create(data) {
    const ref = await addDoc(collection(db, "workingDays"), data);

    return {
      id: ref.id,
      ...data
    };
  },

  async update(id, data) {
    await updateDoc(doc(db, "workingDays", id), data);
    return true;
  },

  async delete(id) {
    await deleteDoc(doc(db, "workingDays", id));
    return true;
  }

};