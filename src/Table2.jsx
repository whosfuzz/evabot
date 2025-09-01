import React, { useEffect, useState } from "react";
import { useUser } from "../lib/context/user";
import { useSearchParams, useLocation } from "react-router-dom";
import Loading from './Loading';

import { Query } from "../lib/appwrite";
import { FaPen, FaTrash, FaPlus, FaMoon, FaSun, FaRandom, FaSignInAlt, FaSignOutAlt } from "react-icons/fa";

function Table2({ databaseId, tableId }) {
  const location = useLocation();

  const { rows, createRow, updateRow, deleteRow, listRows, user, isDarkMode, setIsDarkMode, login, logout, setError } = useUser();
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [newRow, setNewRow] = useState({});
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedRows, setSelectedRows] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null); 
  const [confirmMessage, setConfirmMessage] = useState("");

  function getRelativeTime(date) {
    const now = Date.now();
    const diffInSeconds = (date.getTime() - now) / 1000;
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

    const thresholds = [
      { unit: "year", seconds: 31536000 },
      { unit: "month", seconds: 2592000 },
      { unit: "day", seconds: 86400 },
      { unit: "hour", seconds: 3600 },
      { unit: "minute", seconds: 60 },
      { unit: "second", seconds: 1 },
    ];

    for (const { unit, seconds } of thresholds) {
      const value = Math.round(diffInSeconds / seconds);
      if (Math.abs(value) >= 1 || unit === "second") {
        return rtf.format(value, unit);
      }
    }
  }

  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  const handleCreate = async () => {
    try {
      setLoading(true);
      let folderCheck = newRow.folder?.trim().toLowerCase() || "";
      if (folderCheck === "") {
        setError("Invalid folder name");
        return;
      }

      await createRow({ ...newRow, folder: folderCheck }, "createFolder");
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setNewRow({});
      setIsEditing(false);
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      if ((editRow.folder?.trim().toLowerCase() || "") === "") {
        setError("Invalid folder name");
        return;
      }
      setLoading(true);
      await updateRow(databaseId, tableId, editRow.$id, { ...editRow, folder: editRow.folder?.trim().toLowerCase() || "" }, []);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsEditing(false);
      setEditRow(null);
      setLoading(false);
    }
  };

  const handleDelete = async (row) => {
    setConfirmMessage(`Are you sure you want to delete?\n\nFolder: ${row.folder}\nWeekday: ${row.weekday}`);
    setConfirmAction(() => async () => {
      await deleteRow(databaseId, tableId, row.$id);
      await fetchData();
    });
  };

  const handleLogout = () => {
    setConfirmMessage("Are you sure you want to log out?");
    setConfirmAction(() => async () => {
      await logout();
    });
  };

  const toggleRowSelection = (row) => {
    setSelectedRows((prev) =>
      prev.some((r) => r.$id === row.$id) ? prev.filter((r) => r.$id !== row.$id) : [...prev, row]
    );
  };

  const toggleAll = () => {
    if (selectedRows.length === rows.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows([...rows]);
    }
  };

  const handleSort = (keyword) => {
    setLoading(true);
    const currentAsc = searchParams.get("orderAsc");
    const currentDesc = searchParams.get("orderDesc");

    if (currentAsc === keyword) {
      searchParams.delete("orderAsc");
      searchParams.set("orderDesc", keyword);
    } else if (currentDesc === keyword) {
      searchParams.delete("orderDesc");
      searchParams.set("orderAsc", keyword);
    } else {
      searchParams.delete("orderAsc");
      searchParams.set("orderDesc", keyword);
    }

    setSearchParams(searchParams);
  };

  const [searchInputs, setSearchInputs] = useState({
    folder: "",
    weekday: "",
  });

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      setLoading(true);
      const params = new URLSearchParams(searchParams);

      params.delete("contains");
      params.delete("equal");
      params.delete("offset");

      Object.entries(searchInputs).forEach(([column, value]) => {
        if (value.trim() !== "") {
          params.append("contains", `${column},${value}`);
        }
      });

      setSearchParams(params);
    }
  };

  const handleSearchInputChange = (column, value) => {
    setSearchInputs((prev) => ({ ...prev, [column]: value }));
  };

  const fetchData = async () => {
    const queries = [];
    const mapping = {
      equal: Query.equal,
      contains: Query.contains,
      startsWith: Query.startsWith,
      orderAsc: Query.orderAsc,
      orderDesc: Query.orderDesc,
      limit: Query.limit,
      offset: Query.offset,
    };

    let hasSort = false;

    Object.entries(mapping).forEach(([param, fn]) => {
      const values = searchParams.getAll(param);
      values.forEach((raw) => {
        const args = raw.includes(",") ? raw.split(",") : [raw];
        const parsedArgs = args.map((a) => (isNaN(a) ? a : Number(a)));
        try {
          queries.push(fn(...parsedArgs));
          if (param === "orderAsc" || param === "orderDesc") hasSort = true;
        } catch (err) {
          console.error(`Invalid query param: ${param}=${raw}`, err);
        }
      });
    });

    if (!hasSort) queries.push(Query.orderDesc("$updatedAt"));

    try {
      await listRows(databaseId, tableId, queries);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchParams.toString(), databaseId, tableId]);

  const formatLocalForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  if (loading) return <Loading />;

  return (
    <div className="app-container">
      <div className="main-content">
        <div className="above-table">
          <button
            className="above-table-inner"
            onClick={() => {
              if (!user) {
                setError("Not logged in");
                return;
              }
              setNewRow({});
              setEditRow(null);
              setIsEditing(true);
            }}
          >
            <FaPlus /> Create Message
          </button>

          {user ? (
            <button onClick={handleLogout} className="above-table-inner">
              <FaSignOutAlt /> {user.name}
            </button>
          ) : (
            <button onClick={login} className="above-table-inner">
              <FaSignInAlt /> Login
            </button>
          )}
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    className="selection-th"
                    type="checkbox"
                    checked={rows.length > 0 && selectedRows.length === rows.length}
                    onChange={toggleAll}
                  />
                </th>

                <th>
                  <input
                    placeholder="Folder"
                    value={searchInputs.folder}
                    onChange={(e) => handleSearchInputChange("folder", e.target.value)}
                    onKeyDown={handleSearchKeyPress}
                  />
                </th>

                <th>
                  <input
                    placeholder="Weekday"
                    value={searchInputs.weekday}
                    onChange={(e) => handleSearchInputChange("weekday", e.target.value)}
                    onKeyDown={handleSearchKeyPress}
                  />
                </th>

                <th>
                  <button onClick={() => handleSort("$createdAt")}>Created</button>
                </th>
                <th>
                  <button onClick={() => handleSort("seen")}>Seen</button>
                </th>

                <th>
                  <div className="actions-header">
                    {selectedRows.length > 0 && (
                      <button
                        className="above-actions del-btn"
                        onClick={() => {
                          if (!user) {
                            setError("Not logged in");
                            return;
                          }
                          setConfirmMessage(`Are you sure you want to delete ${selectedRows.length} row(s)?`);
                          setConfirmAction(() => async () => {
                            for (const row of selectedRows) {
                              await deleteRow(databaseId, tableId, row.$id);
                            }
                            setSelectedRows([]);
                            await fetchData();
                          });
                        }}
                      >
                        <FaTrash /> {selectedRows.length}
                      </button>
                    )}

                    <button className="above-actions" onClick={() => setIsDarkMode(!isDarkMode)}>
                      {isDarkMode ? <FaSun /> : <FaMoon />}
                    </button>

                    {selectedRows.length > 0 && (
                      <button
                        className="above-actions"
                        onClick={() => {
                          if (!user) {
                            setError("Not logged in");
                            return;
                          }
                          setConfirmMessage(`Shuffle ${selectedRows.length} row(s)?`);
                          setConfirmAction(() => async () => {
                            for (const row of selectedRows) {
                              const randomTimestamp =
                                Math.random() * (today.getTime() - oneYearAgo.getTime()) + oneYearAgo.getTime();
                              const randomDate = new Date(randomTimestamp).toISOString();
                              await updateRow(databaseId, tableId, row.$id, {
                                ...row,
                                seen: randomDate,
                              });
                            }
                            setSelectedRows([]);
                            await fetchData();
                          });
                        }}
                      >
                        <FaRandom /> {selectedRows.length}
                      </button>
                    )}
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr key={row.$id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRows.some((r) => r.$id === row.$id)}
                      onChange={() => toggleRowSelection(row)}
                    />
                  </td>

                  <td>
                    <a href={`${location.pathname}?equal=folder,${row.folder}`} rel="noopener noreferrer">
                        {row.folder}
                      </a>
                  </td>
                  
                  <td>                    <a href={`${location.pathname}?equal=weekday,${row.weekday}`} rel="noopener noreferrer">
                        {row.weekday}
                      </a></td>
                  <td>{row.$createdAt ? getRelativeTime(new Date(row.$createdAt)) : ""}</td>
                  <td>{row.seen ? getRelativeTime(new Date(row.seen)) : ""}</td>

                  <td>
                  <div className="actions">

                    <button
                      className="action-btn edit-btn"
                      onClick={() => {
                        if (!user) {
                          setError("Not logged in");
                          return;
                        }
                        setEditRow(row);
                        setIsEditing(true);
                      }}
                    >
                      <FaPen />
                    </button>
                    <button
                      className="action-btn del-btn"
                      onClick={() => {
                        if (!user) {
                          setError("Not logged in");
                          return;
                        }
                        handleDelete(row);
                      }}
                    >
                      <FaTrash />
                    </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="below-table">
          <button
            className="below-table-inner"
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              const currentOffset = parseInt(params.get("offset") || "0", 10);
              if (currentOffset > 0) {
                const newOffset = Math.max(0, currentOffset - 25);
                params.set("offset", newOffset);
                setSearchParams(params);
              }
            }}
          >
            Previous
          </button>
          <button className="below-table-inner" onClick={() => {
            window.location.href = "/";
          }}>
            Go to Messages
          </button>
          <button
            className="below-table-inner"
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              const currentOffset = parseInt(params.get("offset") || "0", 10);
              if (rows.length === 25) {
                const newOffset = currentOffset + 25;
                params.set("offset", newOffset);
                setSearchParams(params);
              }
            }}
          >
            Next
          </button>
        </div>

        {confirmAction && (
          <>
            <div className="modal-overlay" onClick={() => setConfirmAction(null)}></div>
            <div className="modal">
              <h2>Confirm</h2>
              <p>{confirmMessage}</p>
              <div className="modal-actions">
                <button
                  className="btn delete-btn"
                  onClick={async () => {
                    setLoading(true);
                    await confirmAction();
                    setConfirmAction(null);
                    setLoading(false);
                  }}
                >
                  Yes
                </button>
                <button className="btn secondary" onClick={() => setConfirmAction(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}

        {isEditing && (
          <>
            <div className="modal-overlay" onClick={() => setIsEditing(false)}></div>
            <div className="modal">
              <h2>{editRow ? "Edit Row" : "Create New Row"}</h2>
              <div className="form-group">
                <label>Folder</label>
                <input
                  type="text"
                  value={editRow ? editRow.folder : newRow.folder || ""}
                  onChange={(e) => {
                    if (editRow) setEditRow({ ...editRow, folder: e.target.value });
                    else setNewRow({ ...newRow, folder: e.target.value });
                  }}
                />
                <label>Weekday</label>
                <select
                value={editRow ? editRow.weekday : newRow.weekday || ""}
                onChange={(e) => {
                    if (editRow) setEditRow({ ...editRow, weekday: e.target.value });
                    else setNewRow({ ...newRow, weekday: e.target.value });
                }}
                >
                <option value="Sunday">Sunday</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
                </select>

                <label>Seen</label>
                <input
                  type="datetime-local"
                  value={
                    editRow
                      ? editRow.seen
                        ? formatLocalForInput(editRow.seen)
                        : ""
                      : newRow.seen
                      ? formatLocalForInput(newRow.seen)
                      : ""
                  }
                  onChange={(e) => {
                    const value = e.target.value ? new Date(e.target.value).toISOString() : null;
                    if (editRow) setEditRow({ ...editRow, seen: value });
                    else setNewRow({ ...newRow, seen: value });
                  }}
                />
              </div>
              <div className="modal-actions">
                <button className="btn primary" onClick={editRow ? handleUpdate : handleCreate}>
                  {editRow ? "Update" : "Create"}
                </button>
                <button className="btn secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Table2;
