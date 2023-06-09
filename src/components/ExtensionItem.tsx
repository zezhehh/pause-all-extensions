const ExtensionItem = ({
  extID,
  extEnabled,
  extShortName,
  selected,
  onClick,
}: {
  extID: string;
  extEnabled: boolean;
  extShortName: string;
  selected: boolean;
  onClick: (extID: string, extEnabled: boolean) => void;
}) => {
  return (
    <div
      className={selected ? "container container-selected" : "container"}
      key={extID}
      onClick={() => onClick(extID, extEnabled)}
    >
      <div
        className={extEnabled ? "green-indicator-small" : "red-indicator-small"}
      />{" "}
      <span className="ext-name">{extShortName}</span>
    </div>
  );
};

export default ExtensionItem;
