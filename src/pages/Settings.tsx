import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Shield, User as UserIcon } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
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

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    if (role !== 'admin') {
      alert("Hanya admin yang dapat mengubah role pengguna.");
      return;
    }
    
    // Prevent removing the last admin (basic safeguard, could be improved)
    if (newRole === 'user') {
      const adminCount = users.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
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

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Pengaturan</h1>
      <div className="mt-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Kelola Pengguna</h3>
            <p className="mt-1 text-sm text-gray-500">
              Pengaturan siapa saja yang bisa menjadi 'admin' dan siapa yang jadi 'user'.
            </p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            {loading ? (
              <p>Memuat pengguna...</p>
            ) : (
              <div className="flex flex-col">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                    <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Pengguna
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Role
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Aksi
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {users.map((u) => (
                            <tr key={u.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{u.name || (u.id === user?.uid ? user?.displayName : 'Unknown')}</div>
                                    <div className="text-sm text-gray-500">{u.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                                  {u.role === 'admin' ? (
                                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Admin</span>
                                  ) : (
                                    <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> User</span>
                                  )}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {role === 'admin' ? (
                                  <select
                                    value={u.role}
                                    onChange={(e) => handleRoleChange(u.id, e.target.value as 'admin' | 'user')}
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                                  >
                                    <option value="admin">Admin</option>
                                    <option value="user">User</option>
                                  </select>
                                ) : (
                                  <span className="text-gray-400">Tidak ada akses</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
