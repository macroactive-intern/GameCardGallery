type EditGamePageProps = {
  params: {
    slug: string;
  };
};

export default function EditGamePage({ params }: EditGamePageProps) {
  return <main>Edit game placeholder: {params.slug}</main>;
}
