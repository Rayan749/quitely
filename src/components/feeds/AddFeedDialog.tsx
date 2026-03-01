import { useState } from 'react';
import {
  makeStyles,
  tokens,
  DialogTrigger,
  Button,
  Input,
  Label,
  Spinner,
  Text,
} from '@fluentui/react-components';
import { AddFilled } from '@fluentui/react-icons';
import { useTranslation } from 'react-i18next';
import { useFeedStore } from '../../stores';
import * as api from '../../api/commands';
import { MacDialog, DialogBody, DialogTitle, DialogContent, DialogActions } from '../../design-system';

const useStyles = makeStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  preview: {
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: '4px',
  },
  error: {
    color: tokens.colorStatusDangerForeground1,
  },
});

interface AddFeedDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function AddFeedDialogContent({ onClose }: { onClose: () => void }) {
  const styles = useStyles();
  const { t } = useTranslation();
  const { addFeed } = useFeedStore();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ title: string; description?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePreview = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const info = await api.fetchFeedInfo(url.trim());
      setPreview({
        title: info.title,
        description: info.description || undefined,
      });
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await addFeed({ xmlUrl: url.trim() });
      onClose();
      setUrl('');
      setPreview(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setUrl('');
    setPreview(null);
    setError(null);
  };

  return (
    <>
      <DialogContent>
        <div className={styles.form}>
          <div className={styles.field}>
            <Label htmlFor="feed-url">{t('addFeed.urlLabel')}</Label>
            <Input
              id="feed-url"
              placeholder="https://example.com/feed.xml"
              value={url}
              onChange={(_, data) => setUrl(data.value)}
              disabled={loading}
            />
          </div>

          <Button onClick={handlePreview} disabled={!url.trim() || loading}>
            {loading ? <Spinner size="tiny" /> : t('addFeed.preview')}
          </Button>

          {preview && (
            <div className={styles.preview}>
              <Text weight="semibold">{preview.title}</Text>
              {preview.description && (
                <Text size={200} block>{preview.description}</Text>
              )}
            </div>
          )}

          {error && (
            <Text className={styles.error}>{error}</Text>
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button appearance="secondary" onClick={handleClose}>
          {t('addFeed.cancel')}
        </Button>
        <Button
          appearance="primary"
          onClick={handleSubmit}
          disabled={!url.trim() || loading}
        >
          {loading ? <Spinner size="tiny" /> : t('addFeed.add')}
        </Button>
      </DialogActions>
    </>
  );
}

export function AddFeedDialog({ open: controlledOpen, onOpenChange }: AddFeedDialogProps) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const handleClose = () => setOpen(false);

  // Controlled mode - no trigger button
  if (onOpenChange !== undefined) {
    return (
      <MacDialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
        <DialogBody>
          <DialogTitle>{t('addFeed.title')}</DialogTitle>
          <AddFeedDialogContent onClose={handleClose} />
        </DialogBody>
      </MacDialog>
    );
  }

  // Uncontrolled mode - with trigger button
  return (
    <MacDialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button appearance="primary" icon={<AddFilled />}>
          {t('addFeed.title')}
        </Button>
      </DialogTrigger>
      <DialogBody>
        <DialogTitle>{t('addFeed.title')}</DialogTitle>
        <AddFeedDialogContent onClose={handleClose} />
      </DialogBody>
    </MacDialog>
  );
}