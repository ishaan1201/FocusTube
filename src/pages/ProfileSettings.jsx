import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { loginWithGoogle, logoutUser, updateUserProfile } from "../services/firebase";
import { LogOut, User, Save, Camera } from "lucide-react";

function Settings() {
    const { currentUser, userProfile } = useAuth();

    // Form State
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [status, setStatus] = useState("");

    // Load existing data when user loads
    useEffect(() => {
        if (userProfile) {
            setName(userProfile.name || "");
            setBio(userProfile.bio || "");
        } else if (currentUser) {
            setName(currentUser.displayName || "");
        }
    }, [userProfile, currentUser]);

    const handleLogin = async () => {
        try { await loginWithGoogle(); } catch (e) { alert(e.message); }
    };

    const handleLogout = async () => {
        await logoutUser();
        window.location.reload();
    };

    const handleSave = async () => {
        setStatus("Saving...");
        try {
            await updateUserProfile(currentUser.uid, name, bio);
            setStatus("Saved Successfully! ✅");
            setIsEditing(false);
            setTimeout(() => setStatus(""), 3000);
        } catch (error) {
            console.error(error);
            setStatus("Error saving. Try again.");
        }
    };

    if (!currentUser) {
        return (
            <div style={styles.container}>
                <div style={styles.loginCard}>
                    <h1>Sign In to FocusTube</h1>
                    <p style={{ color: "#aaa", marginBottom: "20px" }}>Save your notes, history, and preferences to the cloud.</p>
                    <button onClick={handleLogin} style={styles.loginBtn}>
                        <img src="https://www.google.com/favicon.ico" width="20" style={{ marginRight: "10px" }} />
                        Continue with Google
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Account Settings</h1>

            <div style={styles.profileCard}>
                <div style={styles.header}>
                    <img src={currentUser.photoURL} style={styles.avatar} alt="Profile" />
                    <div>
                        <h2 style={{ margin: 0 }}>{name || "User"}</h2>
                        <p style={{ color: "#aaa", margin: 0 }}>{currentUser.email}</p>
                    </div>
                </div>

                <div style={styles.form}>
                    <label style={styles.label}>Display Name</label>
                    <input
                        type="text"
                        value={name}
                        disabled={!isEditing}
                        onChange={(e) => setName(e.target.value)}
                        style={styles.input}
                    />

                    <label style={styles.label}>Bio</label>
                    <textarea
                        value={bio}
                        disabled={!isEditing}
                        onChange={(e) => setBio(e.target.value)}
                        style={{ ...styles.input, height: "100px", resize: "none" }}
                    />

                    <div style={styles.actions}>
                        {!isEditing ? (
                            <button onClick={() => setIsEditing(true)} style={styles.editBtn}>Edit Profile</button>
                        ) : (
                            <button onClick={handleSave} style={styles.saveBtn}>
                                <Save size={18} /> Save Changes
                            </button>
                        )}

                        <button onClick={handleLogout} style={styles.logoutBtn}>
                            <LogOut size={18} /> Sign Out
                        </button>
                    </div>

                    {status && <p style={{ marginTop: "15px", color: status.includes("Error") ? "red" : "#4caf50" }}>{status}</p>}
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: { padding: "40px", color: "white", maxWidth: "800px", margin: "0 auto" },
    loginCard: { background: "#1a1a1a", padding: "40px", borderRadius: "20px", textAlign: "center", border: "1px solid #333", marginTop: "50px" },
    loginBtn: { background: "white", color: "black", border: "none", padding: "12px 24px", borderRadius: "30px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" },

    title: { marginBottom: "30px" },
    profileCard: { background: "#1a1a1a", padding: "30px", borderRadius: "20px", border: "1px solid #333" },
    header: { display: "flex", alignItems: "center", gap: "20px", marginBottom: "30px", paddingBottom: "20px", borderBottom: "1px solid #333" },
    avatar: { width: "80px", height: "80px", borderRadius: "50%", border: "2px solid #4caf50" },

    form: { display: "flex", flexDirection: "column", gap: "15px" },
    label: { fontSize: "14px", color: "#aaa", fontWeight: "bold" },
    input: { background: "#111", border: "1px solid #333", padding: "12px", borderRadius: "8px", color: "white", fontSize: "16px" },

    actions: { display: "flex", gap: "15px", marginTop: "20px" },
    editBtn: { background: "#333", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },
    saveBtn: { background: "#4caf50", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" },
    logoutBtn: { background: "#ff4444", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }
};

export default Settings;