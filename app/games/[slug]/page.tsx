type GamePageProps = {
  params: {
    slug: string;
  };
};

export default function GamePage({ params }: GamePageProps) {
  return <main>Game placeholder: {params.slug}</main>;
}
