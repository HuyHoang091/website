import React, { useState } from "react";
import styles from "./UserManager.module.css";

const sampleUsers = [
  { id: 1, name: "Nguyễn Văn Admin", email: "admin@company.com", role: "admin", status: "active", lastLogin: "2024-01-15 14:30", avatar: "👨‍💼" },
  { id: 2, name: "Trần Thị Manager", email: "manager@company.com", role: "manager", status: "active", lastLogin: "2024-01-15 13:45", avatar: "👩‍💼" },
  { id: 3, name: "Lê Văn User", email: "user@company.com", role: "user", status: "inactive", lastLogin: "2024-01-14 16:20", avatar: "👨‍💻" },
  { id: 4, name: "Phạm Thị Hoa", email: "hoa@company.com", role: "user", status: "active", lastLogin: "2024-01-15 15:10", avatar: "👩‍💻" }
];

const sampleActivities = [
  { id: 1, user: "Nguyễn Văn Admin", action: "Đăng nhập hệ thống", time: "2024-01-15 14:30:25", icon: "🔐" },
  { id: 2, user: "Trần Thị Manager", action: "Cập nhật thông tin user #123", time: "2024-01-15 14:25:10", icon: "✏️" },
  { id: 3, user: "Admin System", action: "Tạo user mới: Phạm Thị Hoa", time: "2024-01-15 14:20:45", icon: "➕" },
  { id: 4, user: "Lê Văn User", action: "Đăng xuất khỏi hệ thống", time: "2024-01-15 14:15:30", icon: "🚪" }
];

const permissionGroups = [
  { name: "Quản lý User", icon: "👥", permissions: [{ name: "Xem danh sách user", key: "user_view" }, { name: "Tạo user mới", key: "user_create" }, { name: "Chỉnh sửa user", key: "user_edit" }, { name: "Xóa user", key: "user_delete" }] },
  { name: "Quản lý Sản phẩm", icon: "📦", permissions: [{ name: "Xem sản phẩm", key: "product_view" }, { name: "Thêm sản phẩm", key: "product_create" }, { name: "Sửa sản phẩm", key: "product_edit" }, { name: "Xóa sản phẩm", key: "product_delete" }] },
  { name: "Báo cáo & Thống kê", icon: "📊", permissions: [{ name: "Xem báo cáo", key: "report_view" }, { name: "Xuất báo cáo", key: "report_export" }, { name: "Tạo báo cáo tùy chỉnh", key: "report_custom" }] },
  { name: "Cài đặt Hệ thống", icon: "⚙️", permissions: [{ name: "Cấu hình hệ thống", key: "system_config" }, { name: "Quản lý backup", key: "system_backup" }, { name: "Xem log hệ thống", key: "system_logs" }] }
];

export default function UserManager() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState(sampleUsers);
  const [activities, setActivities] = useState(sampleActivities);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("create");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});

  const filteredUsers = users.filter(
    (u) => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUser = () => { setModalType("create"); setSelectedUser(null); setShowModal(true); };
  const handleEditUser = (user) => { setModalType("edit"); setSelectedUser(user); setShowModal(true); };
  const handleViewPermissions = (user) => { setModalType("permissions"); setSelectedUser(user); setShowModal(true); };
  const handleDeleteUser = (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa user này?")) return;
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setActivities((prev) => [{ id: prev.length + 1, user: "Current User", action: `Xóa user ID: ${id}`, time: new Date().toLocaleString("vi-VN"), icon: "🗑️" }, ...prev]);
  };

  const togglePermission = (g, p) => {
    const key = `${g}_${p}`;
    setUserPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const roleDisplay = (role) => ({ admin: "👑 Admin", manager: "⭐ Manager", user: "👤 User" }[role] || role);
  const roleClass = (role) => `${styles.roleBadge} ${role === "admin" ? styles.roleAdmin : role === "manager" ? styles.roleManager : styles.roleUser}`;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.titleGlow}>👥 Quản Lý User & Phân Quyền</h1>
        <p className={styles.subtitle}>Quản lý người dùng, phân quyền và theo dõi hoạt động</p>
      </div>

      <div className={styles.navTabs}>
        <button className={`${styles.navTab} ${activeTab === "users" ? styles.navTabActive : ""} ${styles.navTabHover}`} onClick={() => setActiveTab("users")}>👥 Quản lý User</button>
        <button className={`${styles.navTab} ${activeTab === "permissions" ? styles.navTabActive : ""} ${styles.navTabHover}`} onClick={() => setActiveTab("permissions")}>🔑 Phân quyền</button>
        <button className={`${styles.navTab} ${activeTab === "activities" ? styles.navTabActive : ""} ${styles.navTabHover}`} onClick={() => setActiveTab("activities")}>📋 Lịch sử hoạt động</button>
      </div>

      <div className={styles.contentCard}>
        {activeTab === "users" && (
          <>
            <h2 className={styles.sectionTitle}>👥 Danh sách User</h2>

            <div className={styles.controlsBar}>
              <div className={styles.searchBox}>
                <input className={styles.searchInput} placeholder="Tìm kiếm theo tên hoặc email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <span className={styles.searchIcon}>🔍</span>
              </div>
              <button className={styles.btnPrimary} onClick={handleCreateUser}>➕ Thêm User Mới</button>
            </div>

            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>User</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Đăng nhập cuối</th><th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:"1.5rem"}}>{u.avatar}</span><strong>{u.name}</strong></div></td>
                    <td>{u.email}</td>
                    <td><span className={roleClass(u.role)}>{roleDisplay(u.role)}</span></td>
                    <td><span className={u.status === "active" ? styles.statusActive : styles.statusInactive}>{u.status === "active" ? "Hoạt động" : "Không hoạt động"}</span></td>
                    <td>{u.lastLogin}</td>
                    <td>
                      <button className={`${styles.actionBtn} ${styles.btnView}`} onClick={() => handleViewPermissions(u)}><span className="btn-icon">🔑</span> Quyền</button>
                      <button className={`${styles.actionBtn} ${styles.btnEdit}`} onClick={() => handleEditUser(u)}><span className="btn-icon">✏️</span> Sửa</button>
                      <button className={`${styles.actionBtn} ${styles.btnDelete}`} onClick={() => handleDeleteUser(u.id)}><span className="btn-icon">🗑️</span> Xóa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {activeTab === "permissions" && (
          <>
            <h2 className={styles.sectionTitle}>🔑 Cấu hình Phân quyền</h2>
            <div className={styles.permissionsGrid}>
              {permissionGroups.map((g, gi) => (
                <div className={styles.permissionGroup} key={gi}>
                  <div className={styles.groupTitle}><span>{g.icon}</span> {g.name}</div>
                  {g.permissions.map((p, pi) => {
                    const key = `${gi}_${pi}`;
                    return (
                      <div key={pi} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid rgba(102,126,234,0.1)"}}>
                        <span>{p.name}</span>
                        <div className={`${styles.permissionToggle} ${userPermissions[key] ? styles.permissionToggleActive : ""}`} onClick={() => togglePermission(gi, pi)} />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "activities" && (
          <>
            <h2 className={styles.sectionTitle}>📋 Lịch sử Hoạt động</h2>
            <div>
              {activities.map((a) => (
                <div key={a.id} className={styles.activityItem}>
                  <div className={styles.activityIcon}>{a.icon}</div>
                  <div className={styles.activityContent}>
                    <div style={{fontWeight:600,color:"#2d3748"}}><strong>{a.user}</strong> - {a.action}</div>
                    <div style={{color:"#718096",fontSize:"0.9rem"}}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className={styles.modal} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>
              {modalType === "create" && "➕ Thêm User Mới"}
              {modalType === "edit" && "✏️ Chỉnh sửa User"}
              {modalType === "permissions" && "🔑 Phân quyền User"}
            </h3>

            {(modalType === "create" || modalType === "edit") && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Họ và tên</label>
                  <input className={styles.formInput} defaultValue={selectedUser?.name || ""} placeholder="Nhập họ và tên" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email</label>
                  <input className={styles.formInput} defaultValue={selectedUser?.email || ""} placeholder="Nhập email" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Vai trò</label>
                  <select className={styles.formSelect} defaultValue={selectedUser?.role || "user"}>
                    <option value="admin">Quản trị viên</option>
                    <option value="manager">Quản lý</option>
                    <option value="user">Người dùng</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Trạng thái</label>
                  <select className={styles.formSelect} defaultValue={selectedUser?.status || "active"}>
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                  </select>
                </div>
              </>
            )}

            {modalType === "permissions" && (
              <div className={styles.permissionsGrid}>
                {permissionGroups.map((g, gi) => (
                  <div className={styles.permissionGroup} key={gi}>
                    <div className={styles.groupTitle}><span>{g.icon}</span> {g.name}</div>
                    {g.permissions.map((p, pi) => {
                      const key = `${gi}_${pi}`;
                      return (
                        <div key={pi} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid rgba(102,126,234,0.1)"}}>
                          <span>{p.name}</span>
                          <div className={`${styles.permissionToggle} ${userPermissions[key] ? styles.permissionToggleActive : ""}`} onClick={() => togglePermission(gi, pi)} />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            <div className={styles.modalActions}>
              <button className={styles.btnPrimary} onClick={() => setShowModal(false)} style={{background:"#e2e8f0",color:"#4a5568"}}>Hủy</button>
              <button className={styles.btnPrimary}>{modalType === "create" ? "➕ Tạo User" : modalType === "edit" ? "💾 Lưu thay đổi" : "🔑 Cập nhật quyền"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}