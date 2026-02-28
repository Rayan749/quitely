import * as React from 'react';
import {
  makeStyles,
  tokens,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Button,
  Input,
} from '@fluentui/react-components';
import { useLabelsStore } from '../../stores';

const useStyles = makeStyles({
  colorInput: {
    width: '40px',
    height: '32px',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  colorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  colorLabel: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
  },
});

export function LabelDialog() {
  const styles = useStyles();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [color, setColor] = React.useState('#0078d4');
  const { addLabel } = useLabelsStore();

  const handleSubmit = async () => {
    if (name.trim()) {
      await addLabel({ name: name.trim(), color });
      setName('');
      setColor('#0078d4');
      setOpen(false);
    }
  };

  const handleClose = () => {
    setName('');
    setColor('#0078d4');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => {
      if (!data.open) handleClose();
    }}>
      <DialogTrigger disableButtonEnhancement>
        <Button
          appearance="subtle"
          size="small"
          style={{ minWidth: '24px', width: '24px', height: '24px', padding: 0 }}
        >
          +
        </Button>
      </DialogTrigger>
      <DialogSurface>
        <DialogTitle>Add Label</DialogTitle>
        <DialogBody>
          <DialogContent>
            <div className={styles.form}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                  Name
                </label>
                <Input
                  placeholder="Label name"
                  value={name}
                  onChange={(_, data) => setName(data.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <div className={styles.colorRow}>
                <label className={styles.colorLabel}>Color</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className={styles.colorInput}
                />
                <span style={{ fontSize: '14px', color: tokens.colorNeutralForeground3 }}>{color}</span>
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={handleClose}>Cancel</Button>
            <Button appearance="primary" onClick={handleSubmit} disabled={!name.trim()}>Add</Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}