import React, { useState, useEffect } from 'react';
import './App.css';
import { API, Storage } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { listNotes } from './graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation } from './graphql/mutations';

const initialFormState = { name: '', description: '' };

function App() {

  const [notes, setNotes] = useState([])
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(notesFromAPI.map(async note => {
      if (note.image) {
        const image = await Storage.get(note.image);
        note.image = image;
      }
      return note;
    }))
    setNotes(apiData.data.listNotes.items);
  }

  async function createNote() {
    if (!formData.name || !formData.description) return;
    await API.graphql({ query: createNoteMutation, variables: { input: formData } });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setNotes([ ...notes, formData ]);
    setFormData(initialFormState);
  }

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter(note => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});
  }
  
  async function onChange(e) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchNotes();
  }

  return (
    <div className="App">
      <h1>Deje su Post-it</h1>
      <div class="form">
        <div class="formElement">
          <input
            type="text"
            name="nombre"
            onChange={e => setFormData({ ...formData, 'name': e.target.value})}
            placeholder="Nombre del Post-It"
            value={formData.name}
          />
        </div>
        <div class="formElement">
          <input
            type="text"
            name="mensaje"
            onChange={e => setFormData({ ...formData, 'description': e.target.value})}
            placeholder="Contenido del mensajito =D"
            value={formData.description}
          />
        </div>
        <div class="formElement">
          <input
            name="imagen"
            type="file"
            onChange={onChange}
          />
        </div>
        <div class="formElement">
          <input
            type="submit"
            onClick={createNote}
            value="Crear Post-it">
          </input>
        </div>
      </div>
      <div class="posts">
        {
          notes.map(note => (
            <div class="post" key={note.id || note.name}>
              <h2>{note.name}</h2>
              <p>{note.description}</p>
              {
                note.image && <img class="img" src={note.image} alt="broken" style={{width: 400}} />
              }
              <input class="eliminar" type="submit" onClick={() => deleteNote(note)} value="Eliminar Post-it"></input>
            </div>
          ))
        }
      </div>
      <AmplifySignOut />
    </div>
  );

}

export default withAuthenticator(App);