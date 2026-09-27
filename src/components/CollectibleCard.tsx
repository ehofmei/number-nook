import type { ArtStyle, CollectibleDefinition } from '../content/schema';
import { getCollectibleImage } from '../content/catalog';

interface CollectibleCardProps {
  collectible: CollectibleDefinition;
  owned: boolean;
  equipped?: boolean;
  selected?: boolean;
  compact?: boolean;
  artStyle?: ArtStyle;
  onSelect?: () => void;
}

export function CollectibleCard({
  collectible,
  owned,
  equipped = false,
  selected = false,
  compact = false,
  artStyle = 'classic',
  onSelect,
}: CollectibleCardProps) {
  const image = `${import.meta.env.BASE_URL}${getCollectibleImage(collectible, artStyle)}`;
  const content = (
    <>
      <div
        className={`collectible-art ${owned ? '' : 'collectible-art--locked'}`}
        onContextMenu={(event) => event.preventDefault()}
      >
        {owned ? (
          <img src={image} alt={collectible.altText} draggable={false} />
        ) : (
          <span
            className="collectible-art-image"
            style={{ backgroundImage: `url("${image}")` }}
            aria-hidden="true"
          />
        )}
        {!owned && (
          <span className="lock-mark" aria-hidden="true">
            ?
          </span>
        )}
        {equipped && (
          <span className="equipped-check" aria-hidden="true">
            ✓
          </span>
        )}
      </div>
      <div className="collectible-copy">
        <div className="collectible-heading">
          <strong>{owned ? collectible.name : 'Mystery companion'}</strong>
          {collectible.specialGuest && owned && <span className="guest-badge">Guest</span>}
        </div>
        <span className={`rarity rarity--${collectible.rarity}`}>{collectible.rarity}</span>
        {!compact && owned && <p>{collectible.description}</p>}
        {equipped && <span className="equipped-label">Equipped</span>}
      </div>
    </>
  );

  if (onSelect) {
    return (
      <button
        className={`collectible-card ${compact ? 'collectible-card--compact' : ''} ${selected || equipped ? 'collectible-card--selected' : ''}`}
        type="button"
        onClick={onSelect}
        aria-pressed={selected || equipped}
        aria-label={`${collectible.name}${equipped ? ', equipped' : ''}`}
      >
        {content}
      </button>
    );
  }

  return (
    <article className={`collectible-card ${compact ? 'collectible-card--compact' : ''}`}>
      {content}
    </article>
  );
}
