import { useState } from 'react';
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
  Label,
  Spinner,
  Text,
} from '@fluentui/react-components';
import { AddFilled } from '@fluentui/react-icons';
import { useTranslation } from 'react-i18next';
import { useFeedStore } from '../../stores';
import * as api from '../../api/commands';

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

export function AddFeedDialog({ open: controlledOpen, onOpenChange }: AddFeedDialogProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const { addFeed } = useFeedStore();
  const [internalOpen, setInternalOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ title: string; description?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

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
      setOpen(false);
      setUrl('');
      setPreview(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setUrl('');
    setPreview(null);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
      {onOpenChange === undefined ? (
        <DialogTrigger disableButtonEnhancement>
          <Button appearance="primary" icon={<AddFilled />}>
            {t('addFeed.title')}
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogSurface>
        <DialogTitle>{t('addFeed.title')}</DialogTitle>
        <DialogBody>
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
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}