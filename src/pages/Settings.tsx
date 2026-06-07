import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Shield, User as UserIcon, Trash2 } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'supervisor' | 'user';
  createdAt: string;
  lastLoginAt: string;
}

export default function Settings() {
  const { user, role } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersList: UserData[] = [];
        querySnapshot.forEach((doc) => {
          usersList.push({ id: doc.id, ...doc.data() } as UserData);
        });
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'supervisor' | 'user') => {
    if (role !== 'admin') {
      alert("Hanya admin yang dapat mengubah role pengguna.");
      return;
    }
    
    // Prevent removing the last admin (basic safeguard, could be improved)
    if (newRole !== 'admin') {
      const userToChange = users.find(u => u.id === userId);
      const adminCount = users.filter(u => u.role === 'admin').length;
      if (userToChange?.role === 'admin' && adminCount <= 1) {
        alert("Harus ada setidaknya satu admin.");
        return;
      }
    }

    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error("Error updating role", error);
      alert("Gagal memperbarui role.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (role !== 'admin') {
      alert("Hanya admin yang dapat menghapus pengguna.");
      return;
    }

    if (userId === user?.uid) {
      alert("Anda tidak dapat menghapus akun Anda sendiri.");
      return;
    }

    if (!window.confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      console.error("Error deleting user", error);
      alert("Gagal menghapus pengguna.");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Akses Pengguna</h1>
        <p className="mt-1 text-sm text-gray-500">
          Atur role untuk setiap email. Role menentukan akses mereka di aplikasi.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat pengguna...</div>
        ) : (
          <div className="overflow-x-auto mobile-cards">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#FAFAFA]">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                    Nama
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td data-label="Nama" className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium flex-col-mobile">
                      {u.name || (u.id === user?.uid ? user?.displayName : 'Unknown')}
                      {u.id === user?.uid && (
                        <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          (Anda)
                        </span>
                      )}
                    </td>
                    <td data-label="Email" className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {u.email}
                    </td>
                    <td data-label="Role" className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                        u.role === 'admin' ? 'bg-indigo-50 text-indigo-700' : 
                        u.role === 'supervisor' ? 'bg-green-50 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {u.role === 'admin' ? 'Admin' : u.role === 'supervisor' ? 'Supervisor' : 'User'}
                      </span>
                    </td>
                    <td data-label="Aksi" className="px-6 py-4 whitespace-nowrap text-sm">
                      {role === 'admin' ? (
                        <div className="flex items-center space-x-2">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as 'admin' | 'supervisor' | 'user')}
                            disabled={u.id === user?.uid}
                            className="block w-full pl-3 pr-8 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
                          >
                            <option value="admin">Admin</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="user">User</option>
                          </select>
                          {u.id !== user?.uid && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Hapus Pengguna"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
