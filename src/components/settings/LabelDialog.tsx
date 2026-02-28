import * as React from 'react';
import {
  makeStyles,
  tokens,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Button,
  Input,
} from '@fluentui/react-components';
import { AddRegular } from '@fluentui/react-icons';
import { useLabelsStore } from '../../stores';
import { useTranslation } from 'react-i18next';

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
  addButton: {
    minWidth: '20px',
    width: '20px',
    height: '20px',
    padding: '0 4px',
  },
});

export function LabelDialog() {
  const styles = useStyles();
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [color, setColor] = React.useState('#0078d4');
  const { addLabel } = useLabelsStore();

  const handleSubmit = async () => {
    if (name.trim()) {
      try {
        await addLabel({ name: name.trim(), color });
        setName('');
        setColor('#0078d4');
        setOpen(false);
      } catch (error) {
        console.error('Failed to add label:', error);
      }
    }
  };

  const handleClose = () => {
    setName('');
    setColor('#0078d4');
    setOpen(false);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  return (
    <>
      <Button
        appearance="subtle"
        size="small"
        icon={<AddRegular />}
        onClick={handleOpen}
        className={styles.addButton}
        title={t('labelDialog.addLabelTip')}
      />
      <Dialog open={open} onOpenChange={(_, data) => {
        if (!data.open) handleClose();
      }}>
        <DialogSurface>
          <DialogTitle>{t('labelDialog.addLabel')}</DialogTitle>
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
    </>
  );
}