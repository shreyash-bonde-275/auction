import { useState } from "react";
import {
  addCategory,
  addTeam,
  addTool,
  byOrder,
  deleteCategory,
  deleteTeam,
  deleteTool,
  saveIncrement,
} from "../lib/auction";

export default function SetupForms({ cats, settings, teams, tools, state }) {
  const [inc, setInc] = useState(settings.minIncrement);
  const [team, setTeam] = useState({ name: "", budget: "", code: "" });
  const [cat, setCat] = useState("");
  const [tool, setTool] = useState({
    name: "",
    basePrice: "",
    categoryId: "",
    isDefault: false,
  });
  const [confirmDelete, setConfirmDelete] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const toolCat = tool.categoryId || cats[0]?.id || "";

  async function remove(id, action) {
    setDeleteError("");
    try {
      await action();
      setConfirmDelete("");
    } catch (error) {
      setDeleteError(error.message || "Could not delete. Please try again.");
    }
  }

  function deleteActions(id, description, action) {
    return confirmDelete === id ? (
      <div className="delete-confirmation">
        <span>{description} This cannot be undone.</span>
        <button
          className="stop"
          type="button"
          onClick={() => remove(id, action)}
        >
          Confirm delete
        </button>
        <button
          className="alt"
          type="button"
          onClick={() => setConfirmDelete("")}
        >
          Cancel
        </button>
      </div>
    ) : (
      <button
        className="alt delete-action"
        type="button"
        onClick={() => {
          setDeleteError("");
          setConfirmDelete(id);
        }}
      >
        Delete
      </button>
    );
  }

  return (
    <details className="card">
      <summary>
        <h2 style={{ display: "inline" }}>Setup</h2>
      </summary>

      <h3>Minimum increment</h3>
      <input
        type="number"
        value={inc}
        onChange={(e) => setInc(e.target.value)}
      />
      <button onClick={() => saveIncrement(parseInt(inc, 10) || 500)}>
        Save
      </button>

      <h3>Add team</h3>
      <input
        placeholder="Team name"
        value={team.name}
        onChange={(e) => setTeam({ ...team, name: e.target.value })}
      />
      <input
        type="number"
        placeholder="Budget"
        value={team.budget}
        onChange={(e) => setTeam({ ...team, budget: e.target.value })}
      />
      <input
        placeholder="Login code"
        value={team.code}
        onChange={(e) => setTeam({ ...team, code: e.target.value })}
      />
      <button
        disabled={!team.name || !team.budget || !team.code}
        onClick={async () => {
          await addTeam({
            name: team.name.trim(),
            budget: parseInt(team.budget, 10),
            code: team.code.trim(),
          });
          setTeam({ name: "", budget: "", code: "" });
        }}
      >
        Add team
      </button>

      <h3>Add category</h3>
      <input
        placeholder="Category name"
        value={cat}
        onChange={(e) => setCat(e.target.value)}
      />
      <button
        disabled={!cat}
        onClick={async () => {
          await addCategory(cat.trim());
          setCat("");
        }}
      >
        Add category
      </button>

      <h3>Add tool</h3>
      <select
        value={toolCat}
        onChange={(e) => setTool({ ...tool, categoryId: e.target.value })}
      >
        {cats.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <input
        placeholder="Tool name"
        value={tool.name}
        onChange={(e) => setTool({ ...tool, name: e.target.value })}
      />
      <input
        type="number"
        placeholder="Base price"
        value={tool.basePrice}
        onChange={(e) => setTool({ ...tool, basePrice: e.target.value })}
      />
      <label>
        <input
          type="checkbox"
          checked={tool.isDefault}
          onChange={(e) => setTool({ ...tool, isDefault: e.target.checked })}
        />{" "}
        Free default for this category
      </label>
      <br />
      <button
        disabled={!toolCat || !tool.name}
        onClick={async () => {
          await addTool({
            name: tool.name.trim(),
            categoryId: toolCat,
            basePrice: parseInt(tool.basePrice, 10) || 0,
            isDefault: tool.isDefault,
          });
          setTool({
            name: "",
            basePrice: "",
            categoryId: toolCat,
            isDefault: false,
          });
        }}
      >
        {" "}
        Add tool
      </button>

      <h3>Delete items</h3>
      {tools
        .slice()
        .sort(byOrder)
        .map((item) => (
          <div className="row manage-row" key={item.id}>
            <span>{item.name}</span>
            <div className="manage-actions">
              {deleteActions(
                `tool-${item.id}`,
                `Delete ${item.name}, including its inventory and auction history?`,
                () => deleteTool(item, state),
              )}
            </div>
          </div>
        ))}

      <h3>Delete categories</h3>
      {cats.map((category) => (
        <div className="row manage-row" key={category.id}>
          <span>{category.name}</span>
          <div className="manage-actions">
            {deleteActions(
              `category-${category.id}`,
              `Delete ${category.name} and its items, inventory, and auction history?`,
              () => deleteCategory(category, state),
            )}
          </div>
        </div>
      ))}

      <h3>Delete teams</h3>
      {teams.map((entry) => (
        <div className="row manage-row" key={entry.id}>
          <span>{entry.name}</span>
          <div className="manage-actions">
            {deleteActions(
              `team-${entry.id}`,
              `Delete ${entry.name}, including its inventory and auction history?`,
              () => deleteTeam(entry, state),
            )}
          </div>
        </div>
      ))}
      <div className="err" role="alert">
        {deleteError}
      </div>
    </details>
  );
}
